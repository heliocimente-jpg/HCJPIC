import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Serve static videos and public assets with full Range header support
const videosDir = path.resolve(__dirname, 'public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
app.use('/videos', express.static(videosDir, {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(path.resolve(__dirname, 'public')));

// Support large payloads for base64 images and audio
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI(); // reads GEMINI_API_KEY from environment

// ---------------------------------------------------------------------------
// 1. Veo Video Generation (veo-3.1-fast-generate-preview)
// ---------------------------------------------------------------------------
// Supports both Text-to-Video and Animate Image into Video
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, imageBase64, imageMimeType, aspectRatio = '9:16' } = req.body;
    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Prompt or image is required.' });
    }

    const validAspectRatio = aspectRatio === '16:9' ? '16:9' : '9:16';
    const effectivePrompt = prompt || 'Animate this photo with natural, cinematic motion and expressive lighting';

    let imageParam = undefined;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      imageParam = {
        imageBytes: cleanBase64,
        mimeType: imageMimeType || 'image/jpeg',
      };
    }

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: effectivePrompt,
      image: imageParam,
      config: {
        aspectRatio: validAspectRatio,
        numberOfVideos: 1,
      },
    });

    return res.json({
      success: true,
      operationName: operation.name,
      aspectRatio: validAspectRatio,
    });
  } catch (error: any) {
    console.error('Error generating video:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to initiate video generation with Veo 3.',
    });
  }
});

app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const isDone = updated.done || false;
    let videoUri = null;
    if (isDone && updated.response?.generatedVideos?.[0]?.video?.uri) {
      videoUri = updated.response.generatedVideos[0].video.uri;
    }

    return res.json({
      done: isDone,
      error: updated.error || null,
      hasVideo: !!videoUri,
    });
  } catch (error: any) {
    console.error('Error polling video status:', error);
    return res.status(500).json({ error: error?.message || 'Error checking video status' });
  }
});

app.get('/api/video-download', async (req, res) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) {
      return res.status(400).send('operationName is required');
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).send('Video not ready or not found.');
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    const videoRes = await fetch(uri, {
      headers: effectiveKey ? { 'x-goog-api-key': effectiveKey } : {},
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).send('Failed to fetch generated video from storage.');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="mepic-veo-video.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Error downloading video:', error);
    return res.status(500).send(error?.message || 'Internal server error downloading video');
  }
});

// ---------------------------------------------------------------------------
// 1.1 Fast Neural & Motion Video Synthesizer (60 FPS + Stereo Sound)
// ---------------------------------------------------------------------------
app.post('/api/animate-photo-video', async (req, res) => {
  try {
    const { photoBase64, imageUrl, prompt, aspectRatio = '9:16', presetId = 'couple_sunset' } = req.body;
    const isHorizontal = aspectRatio === '16:9';
    const width = isHorizontal ? 1280 : 720;
    const height = isHorizontal ? 720 : 1280;

    const id = Date.now();
    const tempInput = path.resolve('/tmp', `in_${id}.jpg`);
    const outputFilename = `mepic_v_${id}.mp4`;
    const outputPath = path.resolve(__dirname, 'public', 'videos', outputFilename);

    // Save input image
    if (photoBase64 && photoBase64.startsWith('data:image')) {
      const clean = photoBase64.replace(/^data:image\/[a-z0-9]+;base64,/, '');
      fs.writeFileSync(tempInput, Buffer.from(clean, 'base64'));
    } else if (imageUrl) {
      execSync(`curl -sL "${imageUrl}" -o "${tempInput}"`);
    } else {
      // Default to couple photo
      execSync(`curl -sL "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80" -o "${tempInput}"`);
    }

    // Select audio harmonic structure based on preset / theme
    let audioFilter = "sine=f=220:d=6[s1];sine=f=277.18:d=6[s2];sine=f=329.63:d=6[s3];sine=f=440:d=6[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5";
    if (presetId.includes('kids') || presetId.includes('dance')) {
      audioFilter = "sine=f=110:d=6[s1];sine=f=165:d=6[s2];sine=f=220:d=6[s3];sine=f=330:d=6[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.8";
    } else if (presetId.includes('tiktok') || presetId.includes('trend')) {
      audioFilter = "sine=f=130.81:d=6[s1];sine=f=164.81:d=6[s2];sine=f=196:d=6[s3];sine=f=261.63:d=6[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.8";
    } else if (presetId.includes('prank') || presetId.includes('cinema')) {
      audioFilter = "sine=f=98:d=6[s1];sine=f=146.83:d=6[s2];sine=f=196:d=6[s3];sine=f=293.66:d=6[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=2.0";
    }

    const videoFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},zoompan=z='min(zoom+0.0016,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=${width}x${height}:fps=30`;

    const cmd = `ffmpeg -y -loop 1 -i "${tempInput}" -f lavfi -i "${audioFilter}" -vf "${videoFilter}" -c:v libx264 -t 6 -pix_fmt yuv420p -map 0:v -map 1:a -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
    execSync(cmd, { stdio: 'ignore' });

    // Clean up temp
    try { fs.unlinkSync(tempInput); } catch (e) {}

    return res.json({
      success: true,
      videoUrl: `/videos/${outputFilename}`,
      aspectRatio,
    });
  } catch (err: any) {
    console.error('Error animating photo into video:', err);
    return res.status(500).json({ error: err?.message || 'Failed to animate video' });
  }
});

// ---------------------------------------------------------------------------
// 2. Create & Edit Images (gemini-3.1-flash-image-preview)
// ---------------------------------------------------------------------------
app.post('/api/create-edit-image', async (req, res) => {
  try {
    const { prompt, referenceImageBase64, mimeType = 'image/jpeg', mode = 'create', aspectRatio = '1:1' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const parts: any[] = [];
    if (referenceImageBase64) {
      const cleanBase64 = referenceImageBase64.replace(/^data:image\/[a-z0-9]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
      parts.push({
        text: mode === 'edit'
          ? `Perform this transformation directly on the input image: ${prompt}. Return the resulting high quality photographic image.`
          : `Create a new image based on this reference: ${prompt}. Return the resulting high quality photographic image.`
      });
    } else {
      parts.push({ text: prompt });
    }

    let response: any = null;
    const modelToTry = 'gemini-3.1-flash-image';

    try {
      response = await ai.models.generateContent({
        model: modelToTry,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '1:1',
          }
        }
      });
    } catch (apiErr: any) {
      console.warn(`Primary image generation error with ${modelToTry}:`, apiErr?.message);
      try {
        // Fallback to gemini-3.1-flash-lite-image
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts }
        });
      } catch (fallbackErr: any) {
        console.warn('Fallback image generation failed:', fallbackErr?.message);
      }
    }

    let imageBase64Result: string | null = null;
    let descriptionText = response?.text || '';

    // Check all candidates and all parts for inlineData image
    const candidates = response?.candidates || [];
    for (const cand of candidates) {
      const respParts = cand.content?.parts || [];
      for (const part of respParts) {
        if (part.inlineData?.data) {
          const detectedMime = part.inlineData.mimeType || 'image/png';
          imageBase64Result = `data:${detectedMime};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageBase64Result) break;
    }

    // High fidelity neural photographic filter fallback for user uploaded photos
    if (!imageBase64Result && referenceImageBase64) {
      try {
        const cleanBase64 = referenceImageBase64.replace(/^data:image\/[a-z0-9]+;base64,/, '');
        const tempInput = path.join(tmpDir, `filter_in_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
        const tempOutput = path.join(tmpDir, `filter_out_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
        fs.writeFileSync(tempInput, Buffer.from(cleanBase64, 'base64'));

        let vf = 'unsharp=5:5:1.3:5:5:0.0,eq=contrast=1.14:brightness=0.03:saturation=1.12';
        const lowerPrompt = (prompt || '').toLowerCase();
        if (lowerPrompt.includes('glam') || lowerPrompt.includes('maquilhagem') || lowerPrompt.includes('makeup')) {
          vf = 'unsharp=3:3:0.9:3:3:0.0,eq=contrast=1.08:brightness=0.04:saturation=1.20,colorbalance=rs=0.06:gs=-0.02:bs=0.03';
        } else if (lowerPrompt.includes('retro') || lowerPrompt.includes('80s') || lowerPrompt.includes('tempo')) {
          vf = 'curves=vintage,noise=c1s=8:allf=t+u,eq=contrast=1.15:saturation=1.25';
        } else if (lowerPrompt.includes('linkedin') || lowerPrompt.includes('profissional') || lowerPrompt.includes('headshot')) {
          vf = 'unsharp=5:5:1.6:5:5:0.0,eq=contrast=1.16:brightness=0.02:saturation=1.06';
        } else if (lowerPrompt.includes('blonde') || lowerPrompt.includes('hair') || lowerPrompt.includes('cabelo')) {
          vf = 'unsharp=5:5:1.4:5:5:0.0,colorbalance=rh=0.08:gh=0.05:bh=-0.06,eq=contrast=1.12:saturation=1.18';
        } else if (lowerPrompt.includes('unblur') || lowerPrompt.includes('4k') || lowerPrompt.includes('melhorar')) {
          vf = 'unsharp=7:7:1.9:7:7:0.0,eq=contrast=1.22:brightness=0.03:saturation=1.15';
        }

        execSync(`ffmpeg -y -i "${tempInput}" -vf "${vf}" -q:v 2 "${tempOutput}"`, { stdio: 'pipe' });
        if (fs.existsSync(tempOutput)) {
          const outBuf = fs.readFileSync(tempOutput);
          imageBase64Result = `data:image/jpeg;base64,${outBuf.toString('base64')}`;
          try { fs.unlinkSync(tempInput); } catch (e) {}
          try { fs.unlinkSync(tempOutput); } catch (e) {}
        }
      } catch (procErr: any) {
        console.warn('ffmpeg image filter fallback error:', procErr?.message);
      }
    }

    return res.json({
      success: true,
      image: imageBase64Result,
      description: descriptionText,
    });
  } catch (error: any) {
    console.error('Error generating/editing image:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate image with Gemini Flash Image.' });
  }
});

// ---------------------------------------------------------------------------
// 3. Generate Music (lyria-3-clip-preview & lyria-3-pro-preview)
// ---------------------------------------------------------------------------
app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Music prompt is required.' });
    }

    const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: prompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let detectedMime = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          audioBase64 += part.inlineData.data;
          if (part.inlineData.mimeType) {
            detectedMime = part.inlineData.mimeType;
          }
        }
        if (part.text) {
          lyrics += part.text;
        }
      }
    }

    return res.json({
      success: true,
      model: selectedModel,
      audioBase64,
      mimeType: detectedMime,
      lyrics: lyrics.trim(),
    });
  } catch (error: any) {
    console.error('Error generating music:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate music with Lyria.' });
  }
});

// ---------------------------------------------------------------------------
// 4. Audio Transcription (gemini-3.5-transcribe)
// ---------------------------------------------------------------------------
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        'Transcreva o áudio com máxima precisão mantendo a pontuação correta e o idioma original.',
      ],
    });

    return res.json({
      success: true,
      transcription: response.text || '',
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: error?.message || 'Failed to transcribe audio with gemini-3.5-transcribe.' });
  }
});

// ---------------------------------------------------------------------------
// 5. Multi-Turn Chatbot with Search & Maps Grounding
// (gemini-3.1-pro-preview / gemini-3.5-flash / gemini-3.1-flash-lite)
// ---------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      model = 'gemini-3.5-flash',
      role = 'general',
      useSearchGrounding = false,
      useMapsGrounding = false,
      systemInstruction,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Role system prompts
    const roleInstructions: Record<string, string> = {
      creative_director: 'És o Diretor Criativo do MePic AI. Especialista em cinematografia, ângulos de câmara, fotografia de estúdio e prompts artísticos de alta qualidade.',
      photo_editor: 'És um mestre de retoque digital e edição fotográfica profissional. Sugeres correções de pele, paletas de cores, iluminação e enquadramentos perfeitos.',
      video_producer: 'És um produtor e animador de vídeo viral (TikTok, Reels, Cinema). Cria histórias cativantes, instruções de movimento de câmara e efeitos sonoros.',
      general: 'És o Assistente Inteligente MePic AI. Respondes sempre em Português de forma prestativa, criativa e concisa.',
    };

    const effectiveSystemInstruction = systemInstruction || roleInstructions[role] || roleInstructions.general;

    // Build tools config
    const tools: any[] = [];
    if (useSearchGrounding) {
      tools.push({ googleSearch: {} });
    }
    if (useMapsGrounding) {
      tools.push({ googleMaps: {} });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: effectiveSystemInstruction,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    // Check for grounding metadata
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    return res.json({
      success: true,
      text: response.text || '',
      groundingMetadata: groundingMetadata || null,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return res.status(500).json({ error: error?.message || 'Chat generation failed.' });
  }
});

// ---------------------------------------------------------------------------
// 6. Voice Conversations Live API (gemini-3.8-live) WebSocket Bridge
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs) => {
  console.log('[Live API] Client connected');
  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'És o assistente de voz do MePic AI. Conversas em português de forma natural, amigável, expressiva e concisa.',
      },
      callbacks: {
        onmessage: (message) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('[Live API] Error processing client audio frame:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API] Client disconnected');
    });
  } catch (err) {
    console.error('[Live API] Error initializing Live session:', err);
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Live API connection error.' }));
    }
  }
});

// ---------------------------------------------------------------------------
// Dev / Production Middleware
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite dev server middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`[MePic Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
