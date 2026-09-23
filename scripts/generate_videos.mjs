import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const videosDir = path.resolve('public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const videoDefs = [
  {
    filename: 'couple_sunset.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=220:d=5[s1];sine=f=277.18:d=5[s2];sine=f=329.63:d=5[s3];sine=f=440:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'couple_wedding.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0012,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=261.63:d=5[s1];sine=f=329.63:d=5[s2];sine=f=392.00:d=5[s3];sine=f=523.25:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'kids_breakdance.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=110:d=5[s1];sine=f=220:d=5[s2];sine=f=440:d=5[s3];sine=f=880:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.8",
    duration: 5,
  },
  {
    filename: 'kids_superhero.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0018,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=196:d=5[s1];sine=f=293.66:d=5[s2];sine=f=392:d=5[s3];sine=f=587.33:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.6",
    duration: 5,
  },
  {
    filename: 'tiktok_glow_shuffle.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0025,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=130.81:d=5[s1];sine=f=164.81:d=5[s2];sine=f=196:d=5[s3];sine=f=261.63:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.8",
    duration: 5,
  },
  {
    filename: 'tiktok_fashion.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=174.61:d=5[s1];sine=f=220:d=5[s2];sine=f=261.63:d=5[s3];sine=f=349.23:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'whatsapp_motivational.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.001,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=261.63:d=5[s1];sine=f=329.63:d=5[s2];sine=f=392.00:d=5[s3];sine=f=493.88:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'whatsapp_goodmorning.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0012,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=293.66:d=5[s1];sine=f=369.99:d=5[s2];sine=f=440.00:d=5[s3];sine=f=587.33:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'dance_funk.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.003,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=110:d=5[s1];sine=f=165:d=5[s2];sine=f=220:d=5[s3];sine=f=330:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=2.0",
    duration: 5,
  },
  {
    filename: 'dance_grandma.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.002,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=220:d=5[s1];sine=f=330:d=5[s2];sine=f=440:d=5[s3];[s1][s2][s3]amix=inputs=3:duration=first,volume=1.7",
    duration: 5,
  },
  {
    filename: 'dance_pet.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0025,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=261.63:d=5[s1];sine=f=392:d=5[s2];sine=f=523.25:d=5[s3];[s1][s2][s3]amix=inputs=3:duration=first,volume=1.8",
    duration: 5,
  },
  {
    filename: 'singing_lipsync.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=329.63:d=5[s1];sine=f=415.30:d=5[s2];sine=f=493.88:d=5[s3];sine=f=659.25:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.6",
    duration: 5,
  },
  {
    filename: 'prank_news.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0018,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=164.81:d=5[s1];sine=f=246.94:d=5[s2];sine=f=329.63:d=5[s3];sine=f=493.88:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=1.9",
    duration: 5,
  },
  {
    filename: 'photo_motion.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=220:d=5[s1];sine=f=277.18:d=5[s2];sine=f=329.63:d=5[s3];[s1][s2][s3]amix=inputs=3:duration=first,volume=1.5",
    duration: 5,
  },
  {
    filename: 'cinema_hero.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    videoFilter: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=720x1280:fps=30",
    audioFilter: "sine=f=98:d=5[s1];sine=f=146.83:d=5[s2];sine=f=196:d=5[s3];sine=f=293.66:d=5[s4];[s1][s2][s3][s4]amix=inputs=4:duration=first,volume=2.0",
    duration: 5,
  },
];

console.log('Starting video generation...');
for (const def of videoDefs) {
  const destPath = path.join(videosDir, def.filename);
  const tmpImg = path.join('/tmp', `img_${def.filename}.jpg`);
  try {
    console.log(`Generating ${def.filename}...`);
    execSync(`curl -sL "${def.imageUrl}" -o "${tmpImg}"`);
    const cmd = `ffmpeg -y -loop 1 -i "${tmpImg}" -f lavfi -i "${def.audioFilter}" -vf "${def.videoFilter}" -c:v libx264 -t ${def.duration} -pix_fmt yuv420p -map 0:v -map 1:a -c:a aac -b:a 128k -movflags +faststart "${destPath}"`;
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✓ ${def.filename} generated successfully!`);
  } catch (err) {
    console.error(`Failed to generate ${def.filename}:`, err?.message || err);
  }
}
console.log('All videos generated successfully!');
