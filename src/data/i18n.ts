import { Language } from '../types';

export const translations: Record<Language, {
  appName: string;
  tagline: string;
  nav: {
    appClone: string;
    architecture: string;
    wallet: string;
    tokens: string;
    subscribe: string;
  };
  features: {
    dance: string;
    danceDesc: string;
    hair: string;
    hairDesc: string;
    avatars: string;
    avatarsDesc: string;
    ledger: string;
    ledgerDesc: string;
  };
  dance: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadDesc: string;
    selectDance: string;
    selectAudio: string;
    aspectRatio: string;
    generateBtn: string;
    simFailureBtn: string;
    stepExtract: string;
    stepMotion: string;
    stepUpscale: string;
    stepComplete: string;
    tokenRequired: string;
    watchResult: string;
    downloadVideo: string;
    socialExport: string;
  };
  hair: {
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadDesc: string;
    openBottomSheet: string;
    bottomSheetTitle: string;
    bottomSheetSubtitle: string;
    selectStyle: string;
    selectedStyle: string;
    intensity: string;
    applyStyleBtn: string;
    confirmAndGenerate: string;
    beforeAfter: string;
    original: string;
    styled: string;
  };
  wallet: {
    title: string;
    currentBalance: string;
    availableTokens: string;
    recharge: string;
    antiRaceTitle: string;
    antiRaceDesc: string;
    stressTestBtn: string;
    concurrencyResult: string;
    historyTitle: string;
    historyEmpty: string;
    plansTitle: string;
    perWeek: string;
    perMonth: string;
    perYear: string;
  };
  status: {
    queued: string;
    processing: string;
    completed: string;
    failed: string;
    refunded: string;
  };
  alerts: {
    insufficientTokens: string;
    generationStarted: string;
    refundSuccess: string;
    uploadSuccess: string;
  };
}> = {
  pt: {
    appName: 'MePic IA',
    tagline: 'Gerador de Vídeos e Fotos com Inteligência Artificial',
    nav: {
      appClone: 'App MePic (Ao Vivo)',
      architecture: 'Arquitetura & Código',
      wallet: 'Carteira de Moedas',
      tokens: 'Tokens',
      subscribe: 'Assinar VIP',
    },
    features: {
      dance: 'Vídeo de Dança Viral',
      danceDesc: 'Transforme uma única foto em coreografias virais do TikTok e Reels em 9:16.',
      hair: 'Troca de Cabelo & Estilo',
      hairDesc: 'Experimente cortes modernos, cores vibrantes e texturas com acabamento fotorrealista.',
      avatars: 'Filtros Retrô & Studio',
      avatarsDesc: 'Anos 90, LinkedIn profissional, anime cinematográfico e mais.',
      ledger: 'Carteira & Anti-Race Locks',
      ledgerDesc: 'Auditoria de transações atômicas com bloqueio FOR UPDATE e estorno instantâneo.',
    },
    dance: {
      title: 'Vídeo de Dança Viral',
      subtitle: 'Envie uma foto de corpo inteiro ou retrato e veja a mágica da IA transformar em dança.',
      uploadTitle: 'Carregar Foto para Dançar',
      uploadDesc: 'Arraste uma foto ou selecione do seu dispositivo (JPEG ou PNG, até 15MB).',
      selectDance: 'Escolha a Coreografia em Alta',
      selectAudio: 'Trilha Sonora Sincronizada',
      aspectRatio: 'Formato de Exportação',
      generateBtn: 'Gerar Vídeo de Dança',
      simFailureBtn: 'Testar Falha & Estorno Automático',
      stepExtract: '1/4 Extraindo pose e esqueleto facial (OpenPose/MediaPipe)...',
      stepMotion: '2/4 Orquestrando difusão de movimento latente (Kling/Runway AI)...',
      stepUpscale: '3/4 Interpolação de quadros (60 FPS) e codificação H.264 9:16...',
      stepComplete: '4/4 Vídeo viral pronto com sucesso!',
      tokenRequired: 'Custo: 10 Tokens',
      watchResult: 'Resultado Gerado (9:16 TikTok / Reels)',
      downloadVideo: 'Baixar Vídeo MP4',
      socialExport: 'Exportar para Instagram / TikTok',
    },
    hair: {
      title: 'Troca de Cabelo & Estilo',
      subtitle: 'Simule novos visuais antes de ir ao cabeleireiro com preservação de identidade.',
      uploadTitle: 'Carregar Foto de Rosto',
      uploadDesc: 'Tire uma selfie nítida com boa iluminação ou escolha da galeria.',
      openBottomSheet: 'Selecionar Corte & Cor (Bottom Sheet)',
      bottomSheetTitle: 'Catálogo de Estilos & Cores',
      bottomSheetSubtitle: 'Escolha o corte, textura ou tonalidade desejada para a transformação.',
      selectStyle: 'Estilos Disponíveis',
      selectedStyle: 'Estilo Escolhido',
      intensity: 'Intensidade da Transformação',
      applyStyleBtn: 'Confirmar Estilo Selecionado',
      confirmAndGenerate: 'Gerar Transformação de Cabelo',
      beforeAfter: 'Comparador Antes & Depois',
      original: 'Original',
      styled: 'Estilizado IA',
    },
    wallet: {
      title: 'Carteira de Tokens & Sistema Anti-Concorrência',
      currentBalance: 'Saldo Disponível',
      availableTokens: 'Tokens Ativos',
      recharge: 'Recarregar Tokens',
      antiRaceTitle: 'Garantia de Consistência ACID (PostgreSQL)',
      antiRaceDesc: 'Cada dedução executa SELECT balance FROM users WHERE id = :id FOR UPDATE. Isso bloqueia a linha do usuário a nível de banco de dados, tornando matematicamente impossível gastar saldo duplicado em requisições paralelas.',
      stressTestBtn: 'Disparar Teste de Estresse (5 Requisições Concorrentes)',
      concurrencyResult: 'Relatório do Teste de Concorrência',
      historyTitle: 'Extrato de Transações Atômicas',
      historyEmpty: 'Nenhuma transação registrada nesta sessão.',
      plansTitle: 'Planos de Assinatura VIP',
      perWeek: 'R$ 14,90 / semana',
      perMonth: 'R$ 39,90 / mês',
      perYear: 'R$ 199,90 / ano',
    },
    status: {
      queued: 'Na Fila',
      processing: 'Processando IA',
      completed: 'Concluído',
      failed: 'Falha',
      refunded: 'Estornado (Tokens Devolvidos)',
    },
    alerts: {
      insufficientTokens: 'Saldo insuficiente de tokens! Recarregue sua carteira para continuar.',
      generationStarted: 'Geração iniciada com sucesso! Tokens deduzidos atomicamente.',
      refundSuccess: 'A API externa falhou! Seus tokens foram estornados imediatamente para a sua carteira.',
      uploadSuccess: 'Foto carregada com sucesso!',
    },
  },
  en: {
    appName: 'MePic AI',
    tagline: 'AI Photo & Video Generator Clone',
    nav: {
      appClone: 'MePic App (Live)',
      architecture: 'Architecture & Code',
      wallet: 'Token Wallet',
      tokens: 'Tokens',
      subscribe: 'Go VIP',
    },
    features: {
      dance: 'Viral Dance Video',
      danceDesc: 'Turn a single still portrait into trending TikTok & Reels dance videos in 9:16.',
      hair: 'Hair & Style Changer',
      hairDesc: 'Try photorealistic modern cuts, vibrant dye colors, and rich volume textures.',
      avatars: 'Retro & Studio Filters',
      avatarsDesc: '90s Yearbook, professional LinkedIn, cinematic anime, and more.',
      ledger: 'Wallet & Anti-Race Locks',
      ledgerDesc: 'Atomic transaction ledger with SELECT FOR UPDATE row locking and auto-refund.',
    },
    dance: {
      title: 'Viral Dance Video',
      subtitle: 'Upload a portrait and watch generative AI animate it into viral dance choreographies.',
      uploadTitle: 'Upload Photo to Dance',
      uploadDesc: 'Drag a photo or select from device (JPEG or PNG, up to 15MB).',
      selectDance: 'Select Trending Choreography',
      selectAudio: 'Synchronized Soundtrack',
      aspectRatio: 'Export Format',
      generateBtn: 'Generate Dance Video',
      simFailureBtn: 'Simulate Failure & Auto-Refund',
      stepExtract: '1/4 Extracting pose & facial skeleton (OpenPose/MediaPipe)...',
      stepMotion: '2/4 Orchestrating latent motion diffusion (Kling/Runway AI)...',
      stepUpscale: '3/4 Frame interpolation (60 FPS) and H.264 9:16 encoding...',
      stepComplete: '4/4 Viral video generated successfully!',
      tokenRequired: 'Cost: 10 Tokens',
      watchResult: 'Generated Output (9:16 TikTok / Reels)',
      downloadVideo: 'Download MP4 Video',
      socialExport: 'Export to Instagram / TikTok',
    },
    hair: {
      title: 'Hair & Style Changer',
      subtitle: 'Test out new haircuts and colors before visiting the salon with identity preservation.',
      uploadTitle: 'Upload Portrait Photo',
      uploadDesc: 'Take a clear, well-lit selfie or choose from your gallery.',
      openBottomSheet: 'Select Hair & Color (Bottom Sheet)',
      bottomSheetTitle: 'Hair Styles & Color Palette',
      bottomSheetSubtitle: 'Choose the cut, texture, or dye color for your transformation.',
      selectStyle: 'Available Styles',
      selectedStyle: 'Selected Style',
      intensity: 'Transformation Intensity',
      applyStyleBtn: 'Confirm Selected Style',
      confirmAndGenerate: 'Generate Hair Transformation',
      beforeAfter: 'Before & After Comparator',
      original: 'Original',
      styled: 'AI Styled',
    },
    wallet: {
      title: 'Token Wallet & Anti-Concurrency System',
      currentBalance: 'Available Balance',
      availableTokens: 'Active Tokens',
      recharge: 'Recharge Tokens',
      antiRaceTitle: 'ACID Consistency Guarantee (PostgreSQL)',
      antiRaceDesc: 'Every deduction executes SELECT balance FROM users WHERE id = :id FOR UPDATE. This locks the user row at the database engine level, preventing parallel duplicate spends.',
      stressTestBtn: 'Trigger Stress Test (5 Concurrent Requests)',
      concurrencyResult: 'Concurrency Test Audit',
      historyTitle: 'Atomic Transactions Ledger',
      historyEmpty: 'No transactions recorded in this session.',
      plansTitle: 'VIP Subscription Plans',
      perWeek: '$3.99 / week',
      perMonth: '$9.99 / month',
      perYear: '$49.99 / year',
    },
    status: {
      queued: 'Queued',
      processing: 'Processing AI',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded (Tokens Credited Back)',
    },
    alerts: {
      insufficientTokens: 'Insufficient token balance! Please top up your wallet to proceed.',
      generationStarted: 'Generation initiated! Tokens deducted atomically.',
      refundSuccess: 'External AI API failed! Tokens refunded immediately to your wallet.',
      uploadSuccess: 'Photo uploaded successfully!',
    },
  },
  es: {
    appName: 'MePic IA',
    tagline: 'Generador de Fotos y Videos con Inteligencia Artificial',
    nav: {
      appClone: 'App MePic (En Vivo)',
      architecture: 'Arquitectura & Código',
      wallet: 'Billetera de Tokens',
      tokens: 'Tokens',
      subscribe: 'Hacerse VIP',
    },
    features: {
      dance: 'Video de Danza Viral',
      danceDesc: 'Transforma una sola foto en coreografías virales de TikTok y Reels en 9:16.',
      hair: 'Cambio de Cabello y Estilo',
      hairDesc: 'Prueba cortes modernos, colores vibrantes y texturas con acabado hiperrealista.',
      avatars: 'Filtros Retro y Studio',
      avatarsDesc: 'Anuario de los 90, LinkedIn profesional, anime cinematográfico y más.',
      ledger: 'Billetera y Bloqueos Anti-Carrera',
      ledgerDesc: 'Libro mayor de transacciones atómicas con bloqueo FOR UPDATE y reembolso automático.',
    },
    dance: {
      title: 'Video de Danza Viral',
      subtitle: 'Sube un retrato y observa cómo la IA generativa lo anima en bailes virales.',
      uploadTitle: 'Subir Foto para Bailar',
      uploadDesc: 'Arrastra una foto o selecciona desde tu dispositivo (JPEG o PNG, hasta 15MB).',
      selectDance: 'Elige la Coreografía en Tendencia',
      selectAudio: 'Banda Sonora Sincronizada',
      aspectRatio: 'Formato de Exportación',
      generateBtn: 'Generar Video de Danza',
      simFailureBtn: 'Simular Fallo y Reembolso Automático',
      stepExtract: '1/4 Extrayendo pose y esqueleto facial (OpenPose/MediaPipe)...',
      stepMotion: '2/4 Orquestando difusión de movimiento latente (Kling/Runway AI)...',
      stepUpscale: '3/4 Interpolación de cuadros (60 FPS) y codificación H.264 9:16...',
      stepComplete: '4/4 ¡Video viral generado con éxito!',
      tokenRequired: 'Costo: 10 Tokens',
      watchResult: 'Resultado Generado (9:16 TikTok / Reels)',
      downloadVideo: 'Descargar Video MP4',
      socialExport: 'Exportar a Instagram / TikTok',
    },
    hair: {
      title: 'Cambio de Cabello y Estilo',
      subtitle: 'Prueba nuevos cortes y tintes antes de ir al salón con preservación de identidad.',
      uploadTitle: 'Subir Foto de Rostro',
      uploadDesc: 'Toma una selfie nítida con buena luz o elige de tu galería.',
      openBottomSheet: 'Seleccionar Corte y Color (Bottom Sheet)',
      bottomSheetTitle: 'Catálogo de Estilos y Colores',
      bottomSheetSubtitle: 'Elige el corte, textura o color deseado para la transformación.',
      selectStyle: 'Estilos Disponibles',
      selectedStyle: 'Estilo Seleccionado',
      intensity: 'Intensidad de la Transformación',
      applyStyleBtn: 'Confirmar Estilo Seleccionado',
      confirmAndGenerate: 'Generar Transformación de Cabello',
      beforeAfter: 'Comparador Antes y Después',
      original: 'Original',
      styled: 'Estilizado IA',
    },
    wallet: {
      title: 'Billetera de Tokens y Sistema Anti-Concurrencia',
      currentBalance: 'Saldo Disponible',
      availableTokens: 'Tokens Activos',
      recharge: 'Recargar Tokens',
      antiRaceTitle: 'Garantía de Consistencia ACID (PostgreSQL)',
      antiRaceDesc: 'Cada deducción ejecuta SELECT balance FROM users WHERE id = :id FOR UPDATE.',
      stressTestBtn: 'Ejecutar Prueba de Concurrencia (5 Peticiones Simultáneas)',
      concurrencyResult: 'Auditoría de Concurrencia',
      historyTitle: 'Libro Mayor de Transacciones Atómicas',
      historyEmpty: 'No hay transacciones registradas en esta sesión.',
      plansTitle: 'Planes de Suscripción VIP',
      perWeek: '$3.99 / semana',
      perMonth: '$9.99 / mes',
      perYear: '$49.99 / año',
    },
    status: {
      queued: 'En Cola',
      processing: 'Procesando IA',
      completed: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado (Tokens Devueltos)',
    },
    alerts: {
      insufficientTokens: '¡Saldo insuficiente de tokens! Recarga tu billetera para continuar.',
      generationStarted: '¡Generación iniciada! Tokens deducidos atómicamente.',
      refundSuccess: '¡La API externa falló! Tokens reembolsados inmediatamente a tu billetera.',
      uploadSuccess: '¡Foto subida con éxito!',
    },
  },
};
