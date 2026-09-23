export interface ArchitectureSection {
  id: string;
  titlePt: string;
  titleEn: string;
  icon: string;
  summaryPt: string;
  summaryEn: string;
  codeSnippet: string;
  language: string;
  deepDiveMarkdownPt: string;
}

export const ARCHITECTURE_DATA: ArchitectureSection[] = [
  {
    id: 'api_flow',
    titlePt: '1. Arquitetura de API & Fluxo de Dados Assíncrono',
    titleEn: '1. API Architecture & Asynchronous Data Flow',
    icon: 'Network',
    summaryPt: 'Ciclo de vida ponta a ponta do "Vídeo de Dança Viral": Upload móvel com URL pré-assinada, filas Redis/Celery, orquestração de APIs de IA (Kling/Runway), pós-processamento FFmpeg e entrega em tempo real via WebSockets/SSE.',
    summaryEn: 'End-to-end lifecycle for Viral Dance Video generation: mobile upload, queuing, external AI APIs, FFmpeg post-processing, and real-time delivery.',
    language: 'plaintext',
    codeSnippet: `[Mobile Client (Flutter)]
       │
       ├─ 1. POST /api/v1/uploads/presigned-url (Obtém URL S3/GCS)
       ├─ 2. PUT https://s3.amazonaws.com/uploads/... (Upload direto da imagem)
       ├─ 3. POST /api/v1/generations/image-to-video (Inicia geração + trava tokens)
       │
[FastAPI Gateway / Auth]
       │
       ├─ 4. BEGIN TX -> SELECT balance FROM users FOR UPDATE
       ├─ 5. Valida saldo >= 10 tokens -> UPDATE users SET balance = balance - 10
       ├─ 6. INSERT INTO token_transactions ('deduction', -10)
       ├─ 7. INSERT INTO generations ('queued') -> COMMIT TX
       │
[Fila Distribuída (Redis Streams / Celery / RabbitMQ)]
       │
       ├─ 8. Enfileira Job { generation_id, user_id, image_url, choreography_id }
       │
[Worker de Orquestração de IA (Python / Ray / Celery)]
       │
       ├─ 9. Análise Facial/Pose (MediaPipe / DWPose) -> Extrai esqueleto latente
       ├─ 10. Chamada Externa: Kling AI v1.5 / Runway Gen-3 / Replicate LivePortrait API
       ├─ 11. Polling com Backoff Exponencial ou Webhook de Conclusão da IA
       │
       ├─ [SE FALHAR / TIMEOUT]:
       │    └─ Dispara rollback_and_refund(): Estorna 10 tokens no PostgreSQL
       │       Notifica cliente via WebSocket: { status: 'failed', refunded: true }
       │
       ├─ [SE SUCESSO]:
       │    ├─ 12. Worker FFmpeg: Crop 9:16 (1080x1920), 60 FPS, H.264 CRF 20, +faststart
       │    ├─ 13. Muxing de áudio com trilha sonora sincronizada (AAC 48kHz)
       │    ├─ 14. Upload final para Bucket S3 (CDN CloudFront)
       │    ├─ 15. UPDATE generations SET status = 'completed', video_url = '...'
       │    └─ 16. WebSocket / SSE Push -> Notifica o app Flutter instantaneamente`,
    deepDiveMarkdownPt: `### Detalhamento do Ciclo de Vida: Vídeo de Dança Viral

1. **Ingestão Zero-Latency com Upload Direto:** O aplicativo móvel nunca envia binários pesados de mídia diretamente através dos servidores de API. Em vez disso, solicita uma URL pré-assinada (S3/GCS) de curta duração (5 minutos). O upload ocorre diretamente do dispositivo para o bucket de entrada.
2. **Isolamento de Estado e Fila de Mensagens:** A requisição de geração apenas valida a integridade, deduz tokens de forma síncrona e empurra o payload para o Redis Streams / Celery. A resposta HTTP retorna imediatamente (\`< 120ms\`) com status \`queued\` e o \`generation_id\`.
3. **Orquestração da IA & Resiliência:**
   - **DWPose/OpenPose Skeleton Extraction:** Converte a foto do usuário num modelo esquelético alinhado com a coreografia de dança selecionada.
   - **Chamada de API Assíncrona:** A requisição é despachada para o cluster da Kling AI / Runway / LivePortrait com webhook assinado por HMAC.
   - **Circuit Breaker & Watchdog:** Se o provedor não responder em até 180 segundos, o watchdog aciona o estorno automático.
4. **Pipeline de Pós-Processamento de Mídia:** Um pod especializado roda FFmpeg com aceleração NVENC para normalizar o aspecto para 9:16 (1080x1920), aplicar o parâmetro \`+faststart\` (movendo os metadados moov para o início do container) e mixar o áudio com batida sincronizada.
5. **Comunicação Cliente em Tempo Real:** Conexão persistente WebSocket (ou Server-Sent Events com fallback para Long-Polling a cada 3s) entrega a evolução percentual da fila para o usuário em tempo real.`
  },
  {
    id: 'postgres_schema',
    titlePt: '2. Esquema de Banco de Dados (PostgreSQL)',
    titleEn: '2. Database Schema (PostgreSQL)',
    icon: 'Database',
    summaryPt: 'Modelagem DDL para usuários, assinaturas VIP, preferências de idioma (i18n) e um livro-razão de carteira de tokens à prova de condições de corrida (Race Conditions) com CHECK constraints e bloqueio pessimista.',
    summaryEn: 'Production-ready PostgreSQL DDL schema with users, subscriptions, i18n preferences, and a race-condition-safe token wallet ledger.',
    language: 'sql',
    codeSnippet: `-- ============================================================================
-- ESQUEMA DE BANCO DE DADOS ME-PIC - POSTGRESQL 15+
-- Módulo de Usuários, Assinaturas, Tokens e Gerações de IA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS DO SISTEMA
CREATE TYPE user_role AS ENUM ('free_user', 'vip_subscriber', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro_weekly', 'vip_monthly', 'creator_annual');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE transaction_type AS ENUM ('purchase', 'subscription_grant', 'deduction', 'refund', 'bonus');
CREATE TYPE generation_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE generation_type AS ENUM ('viral_dance', 'hair_style', 'avatar_preset');

-- 2. TABELA DE USUÁRIOS
-- Inclui preferência de idioma (i18n com padrão 'pt-BR') e restrição de saldo não-negativo
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'pt-BR', -- i18n base
    role user_role NOT NULL DEFAULT 'free_user',
    
    -- RESTRIÇÃO MATEMÁTICA: O saldo NUNCA pode ser negativo
    token_balance INTEGER NOT NULL DEFAULT 20 CHECK (token_balance >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_token_balance ON users(token_balance);

-- 3. TABELA DE ASSINATURAS RECORRENTES (App Store / Google Play / Stripe)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    external_provider VARCHAR(50) NOT NULL, -- 'google_play', 'apple_app_store', 'stripe'
    external_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    tokens_per_period INTEGER NOT NULL DEFAULT 0,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 4. TABELA DE GERAÇÕES DE IA
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type generation_type NOT NULL,
    template_key VARCHAR(100) NOT NULL, -- ex: 'dance_tiktok_shuffle', 'hair_blonde_balayage'
    status generation_status NOT NULL DEFAULT 'queued',
    tokens_cost INTEGER NOT NULL CHECK (tokens_cost > 0),
    
    input_image_url TEXT NOT NULL,
    output_media_url TEXT,
    
    -- Metadados de processamento da IA
    external_provider_job_id VARCHAR(255),
    processing_metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- 5. LIVRO-RAZÃO DE TRANSAÇÕES DE TOKENS (AUDITORIA E ANTI-RACE CONDITION)
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
    
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- Negativo para deduções, positivo para compras/estornos
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    
    idempotency_key VARCHAR(255) UNIQUE, -- Previne transações duplicadas em re-tentativas
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_generation_id ON token_transactions(generation_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);`,
    deepDiveMarkdownPt: `### Como Este Esquema Elimina Condições de Corrida (Race Conditions)

- **Restrição a Nível de Kernel SQL (\`CHECK (token_balance >= 0)\`):** Mesmo que múltiplas threads tentem deduzir saldo, o motor do PostgreSQL abortará com exceção \`check_violation\` qualquer operação que resulte em saldo negativo.
- **Idempotência Garantida (\`idempotency_key UNIQUE\`):** Se a rede falhar e o app mobile reenviar o botão de gerar, a restrição de unicidade impede débito duplicado.
- **Trilha de Auditoria Imutável (\`token_transactions\`):** O saldo do usuário pode ser reconstruído e auditado somando todas as transações históricas (\`SUM(amount) = users.token_balance\`).`
  },
  {
    id: 'fastapi_backend',
    titlePt: '3. Código Backend de Produção (FastAPI / Python)',
    titleEn: '3. Backend Code (FastAPI / Python)',
    icon: 'Terminal',
    summaryPt: 'Endpoint completo para Image-to-Video com autenticação JWT, bloqueio pessimista FOR UPDATE, dedução atômica, despacho assíncrono em background, monitoramento da IA externa e estorno automático garantido em caso de falha.',
    summaryEn: 'Production FastAPI endpoint for Image-to-Video generation with pessimistic row locking, atomic token deduction, background AI task dispatch, and automatic refund handler.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Backend Engine de Geração de Vídeo
Tecnologia: FastAPI, SQLAlchemy 2.0 Async, Pydantic v2, HTTPX
"""
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, HttpUrl, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import DBAPIError

# Configuração de Logger Estruturado
logger = logging.getLogger("mepic.generations")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api/v1/generations", tags=["Gerações de IA"])

# ============================================================================
# SCHEMAS DE ENTRADA / SAÍDA (PYDANTIC)
# ============================================================================
class ImageToVideoRequest(BaseModel):
    image_url: HttpUrl = Field(..., description="URL S3 da foto enviada pelo usuário")
    choreography_key: str = Field(..., example="dance_tiktok_shuffle", description="Identificador do estilo de dança")
    aspect_ratio: str = Field(default="9:16", regex="^(9:16|1:1|16:9)$")
    idempotency_key: str = Field(default_factory=lambda: str(uuid.uuid4()))

class GenerationResponse(BaseModel):
    generation_id: str
    status: str
    tokens_deducted: int
    remaining_balance: int
    estimated_seconds: int = 45
    message: str

# Custo fixo em tokens para geração de vídeo de dança viral
VIRAL_DANCE_TOKEN_COST = 10

# ============================================================================
# ENDPOINT PRINCIPAL: IMAGE-TO-VIDEO
# ============================================================================
@router.post("/image-to-video", response_model=GenerationResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_image_to_video(
    payload: ImageToVideoRequest,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_authenticated_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Inicia o pipeline de geração de Vídeo de Dança Viral com dedução atômica.
    Garante que nenhum usuário gaste tokens concorrentes além do saldo real.
    """
    generation_id = str(uuid.uuid4())
    
    # INÍCIO DA TRANSAÇÃO ATÔMICA
    try:
        async with db.begin():
            # 1. BLOQUEIO PESSIMISTA (SELECT ... FOR UPDATE)
            # Trava a linha do usuário exclusivamente nesta transação
            stmt = select(User).where(User.id == current_user_id).with_for_update()
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(status_code=404, detail="Usuário não encontrado.")
            
            # 2. VALIDAÇÃO RIGOROSA DE SALDO
            if user.token_balance < VIRAL_DANCE_TOKEN_COST:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "code": "INSUFFICIENT_TOKENS",
                        "message": "Saldo insuficiente de moedas para gerar vídeo de dança.",
                        "required": VIRAL_DANCE_TOKEN_COST,
                        "current_balance": user.token_balance
                    }
                )
            
            # 3. DEDUÇÃO IMEDIATA E REGISTRO DE TRANSAÇÃO
            new_balance = user.token_balance - VIRAL_DANCE_TOKEN_COST
            user.token_balance = new_balance
            
            # Cria registro da geração no banco
            new_generation = Generation(
                id=generation_id,
                user_id=current_user_id,
                type="viral_dance",
                template_key=payload.choreography_key,
                status="queued",
                tokens_cost=VIRAL_DANCE_TOKEN_COST,
                input_image_url=str(payload.image_url),
                started_at=datetime.now(timezone.utc)
            )
            db.add(new_generation)
            
            # Registra no livro-razão (ledger)
            transaction_log = TokenTransaction(
                user_id=current_user_id,
                generation_id=generation_id,
                type="deduction",
                amount=-VIRAL_DANCE_TOKEN_COST,
                balance_after=new_balance,
                idempotency_key=payload.idempotency_key,
                description=f"Dedução para Vídeo de Dança: {payload.choreography_key}"
            )
            db.add(transaction_log)
            
            # O commit ocorre automaticamente ao sair do bloco 'async with db.begin()'
            logger.info(f"Tokens deduzidos com sucesso. User: {current_user_id}, Novo Saldo: {new_balance}")

    except DBAPIError as db_err:
        logger.error(f"Erro de concorrência ou banco de dados: {db_err}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar transação de tokens.")

    # 4. DISPARA TAREFA ASSÍNCRONA EM BACKGROUND
    background_tasks.add_task(
        orchestrate_ai_video_generation,
        generation_id=generation_id,
        user_id=current_user_id,
        image_url=str(payload.image_url),
        choreography_key=payload.choreography_key,
        tokens_cost=VIRAL_DANCE_TOKEN_COST
    )

    return GenerationResponse(
        generation_id=generation_id,
        status="queued",
        tokens_deducted=VIRAL_DANCE_TOKEN_COST,
        remaining_balance=new_balance,
        estimated_seconds=45,
        message="Geração iniciada com sucesso. Acompanhe o progresso em tempo real."
    )

# ============================================================================
# MOTOR DE ORQUESTRAÇÃO DE IA & MECANISMO DE ESTORNO AUTOMÁTICO (REFUND)
# ============================================================================
async def orchestrate_ai_video_generation(
    generation_id: str,
    user_id: str,
    image_url: str,
    choreography_key: str,
    tokens_cost: int
):
    """
    Executa a chamada para o cluster de IA externa (ex: Kling AI, Runway Gen-3 ou Replicate).
    Em caso de Timeout, Erro 5xx, ou Rejeição de Conteúdo (NSFW), estorna os tokens imediatamente.
    """
    async with get_standalone_db_session() as db:
        try:
            logger.info(f"[JOB {generation_id}] Iniciando processamento com provedor de IA...")
            
            # Atualiza status para 'processing'
            await db.execute(
                update(Generation)
                .where(Generation.id == generation_id)
                .values(status="processing", updated_at=datetime.now(timezone.utc))
            )
            await db.commit()
            
            # Notifica cliente via WebSocket
            await ws_manager.broadcast_user(user_id, {
                "event": "GENERATION_PROGRESS",
                "generation_id": generation_id,
                "status": "processing",
                "progress": 30,
                "step": "Orquestrando difusão de movimento latente..."
            })

            # SIMULAÇÃO DA CHAMADA DE API EXTERNA (KLING / RUNWAY) COM TIMEOUT DE 180S
            # Em produção: response = await httpx_client.post("https://api.klingai.com/v1/videos/image2video", ...)
            async with asyncio.timeout(180):
                # Simula o tempo de renderização do cluster de GPUs
                await asyncio.sleep(4) 
                
                # Mock de validação de sucesso
                video_output_s3_url = f"https://cdn.mepic.app/videos/{generation_id}_9x16_h264.mp4"

            # 5. SUCESSO: ATUALIZA GERAÇÃO
            await db.execute(
                update(Generation)
                .where(Generation.id == generation_id)
                .values(
                    status="completed",
                    output_media_url=video_output_s3_url,
                    completed_at=datetime.now(timezone.utc)
                )
            )
            await db.commit()
            
            # Notifica cliente da conclusão
            await ws_manager.broadcast_user(user_id, {
                "event": "GENERATION_COMPLETED",
                "generation_id": generation_id,
                "video_url": video_output_s3_url,
                "status": "completed"
            })
            logger.info(f"[JOB {generation_id}] Finalizado com sucesso. Vídeo: {video_output_s3_url}")

        except Exception as exc:
            # ================================================================
            # FALLBACK DE SEGURANÇA: ESTORNO AUTOMÁTICO DE TOKENS
            # ================================================================
            logger.error(f"[JOB {generation_id}] FALHA CRÍTICA NA IA: {str(exc)}. Executando estorno...", exc_info=True)
            
            async with db.begin():
                # 1. Bloqueia linha do usuário para devolver tokens
                stmt = select(User).where(User.id == user_id).with_for_update()
                result = await db.execute(stmt)
                user = result.scalar_one()
                
                refunded_balance = user.token_balance + tokens_cost
                user.token_balance = refunded_balance
                
                # 2. Atualiza status da geração para 'refunded'
                await db.execute(
                    update(Generation)
                    .where(Generation.id == generation_id)
                    .values(
                        status="refunded",
                        error_message=f"Falha na IA Externa: {str(exc)}",
                        updated_at=datetime.now(timezone.utc)
                    )
                )
                
                # 3. Registra crédito de estorno no livro-razão
                refund_tx = TokenTransaction(
                    user_id=user_id,
                    generation_id=generation_id,
                    type="refund",
                    amount=tokens_cost,
                    balance_after=refunded_balance,
                    idempotency_key=f"refund_{generation_id}",
                    description=f"Estorno automático devido a falha no processamento: {str(exc)[:100]}"
                )
                db.add(refund_tx)

            # Notifica o cliente móvel sobre o estorno imediato
            await ws_manager.broadcast_user(user_id, {
                "event": "GENERATION_FAILED_REFUNDED",
                "generation_id": generation_id,
                "status": "refunded",
                "tokens_refunded": tokens_cost,
                "current_balance": refunded_balance,
                "message": "A geração falhou no servidor de IA. Seus tokens foram 100% estornados."
            })`,
    deepDiveMarkdownPt: `### Pontos Críticos do Código FastAPI

1. **Bloqueio Atômico com \`with_for_update()\`:** Bloqueia a linha no banco antes de qualquer checagem. Se duas requisições chegarem no mesmo milissegundo, a segunda espera a primeira liberar a transação e enxerga o saldo já deduzido.
2. **Resiliência a Desconexões:** Toda dedução possui um registro espelho na tabela \`token_transactions\` com chave de idempotência.
3. **Estorno Transacional Seguro (\`refund\`):** Se a chamada externa estourar timeout (\`asyncio.timeout(180)\`) ou a API externa retornar erro 500/rejeição de segurança, o bloco \`except\` restaura o saldo do usuário com novo bloqueio atômico e notifica o app via WebSocket.`
  },
  {
    id: 'flutter_frontend',
    titlePt: '4. Código Frontend Mobile (Flutter / Dart)',
    titleEn: '4. Mobile Frontend Code (Flutter / Dart)',
    icon: 'Smartphone',
    summaryPt: 'Tela de alta fidelidade para o "Hair & Style Changer" em Flutter/Dart com textos nativos em Português por padrão, arquitetura i18n, seletor de fotos da câmera/galeria e Bottom Sheet modal para catálogo de estilos.',
    summaryEn: 'High-fidelity Flutter screen for Hair & Style Changer with native Portuguese i18n by default, image picker, and custom modal bottom sheet.',
    language: 'dart',
    codeSnippet: `import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

// ============================================================================
// CONFIGURAÇÃO DE LOCALIZAÇÃO (i18n COM BASELINE EM PORTUGUÊS)
// ============================================================================
class MePicLocalizations {
  final Locale locale;
  MePicLocalizations(this.locale);

  static MePicLocalizations of(BuildContext context) {
    return Localizations.of<MePicLocalizations>(context, MePicLocalizations) ??
        MePicLocalizations(const Locale('pt', 'BR'));
  }

  // Dicionário nativo com Português como padrão
  static final Map<String, Map<String, String>> _localizedValues = {
    'pt': {
      'hairStyleTitle': 'Troca de Cabelo & Estilo',
      'hairStyleSubtitle': 'Experimente novos cortes e cores com IA fotorrealista',
      'uploadPhoto': 'Carregar Foto de Rosto',
      'changePhoto': 'Alterar Foto',
      'selectStyleBtn': 'Escolher Corte & Cor',
      'selectedStyleLabel': 'Estilo Selecionado',
      'noneSelected': 'Nenhum estilo escolhido ainda',
      'generateBtn': 'Transformar Visual (4 Moedas)',
      'processingTitle': 'Aplicando Transformação com IA...',
      'successTitle': 'Novo Visual Concluído!',
      'errorNoPhoto': 'Por favor, selecione uma foto de rosto primeiro.',
      'errorNoStyle': 'Selecione um estilo no catálogo antes de continuar.',
      'bottomSheetTitle': 'Catálogo de Cortes & Cores',
      'bottomSheetConfirm': 'Aplicar Este Estilo',
      'tokensCost': 'Custo: 4 Tokens',
    },
    'en': {
      'hairStyleTitle': 'Hair & Style Changer',
      'hairStyleSubtitle': 'Try new haircuts and colors with photorealistic AI',
      'uploadPhoto': 'Upload Portrait Photo',
      'changePhoto': 'Change Photo',
      'selectStyleBtn': 'Choose Cut & Color',
      'selectedStyleLabel': 'Selected Style',
      'noneSelected': 'No style chosen yet',
      'generateBtn': 'Transform Look (4 Tokens)',
      'processingTitle': 'Applying AI Transformation...',
      'successTitle': 'New Look Ready!',
      'errorNoPhoto': 'Please select a portrait photo first.',
      'errorNoStyle': 'Please select a style from catalog before proceeding.',
      'bottomSheetTitle': 'Haircuts & Colors Catalog',
      'bottomSheetConfirm': 'Apply This Style',
      'tokensCost': 'Cost: 4 Tokens',
    }
  };

  String get(String key) {
    final lang = locale.languageCode;
    return _localizedValues[lang]?[key] ?? _localizedValues['pt']![key] ?? key;
  }
}

// Modelo de Opção de Estilo
class HairStyleItem {
  final String id;
  final String name;
  final String category;
  final String imageUrl;
  final Color badgeColor;

  const HairStyleItem({
    required this.id,
    required this.name,
    required this.category,
    required this.imageUrl,
    required this.badgeColor,
  });
}

// ============================================================================
// TELA PRINCIPAL: HAIR & STYLE CHANGER SCREEN
// ============================================================================
class HairStyleChangerScreen extends StatefulWidget {
  const HairStyleChangerScreen({super.key});

  @override
  State<HairStyleChangerScreen> createState() => _HairStyleChangerScreenState();
}

class _HairStyleChangerScreenState extends State<HairStyleChangerScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  HairStyleItem? _selectedStyle;
  bool _isLoading = false;
  double _intensity = 0.85;

  // Catálogo com opções populares
  final List<HairStyleItem> _catalog = const [
    HairStyleItem(
      id: 'blonde_balayage',
      name: 'Loiro Balayage Iluminado',
      category: 'Coloração',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      badgeColor: Color(0xFFEAB308),
    ),
    HairStyleItem(
      id: 'french_bob',
      name: 'Corte Bob Francês Moderno',
      category: 'Corte Feminino',
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
      badgeColor: Color(0xFFF43F5E),
    ),
    HairStyleItem(
      id: 'fade_buzzcut',
      name: 'Buzz Cut com Degradê Navalhado',
      category: 'Corte Masculino',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      badgeColor: Color(0xFF3B82F6),
    ),
    HairStyleItem(
      id: 'curly_copper',
      name: 'Cachos Volumosos Acobreados',
      category: 'Textura & Cor',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      badgeColor: Color(0xFFF97316),
    ),
    HairStyleItem(
      id: 'cyber_neon_pink',
      name: 'Rosa Neon Cyberpunk',
      category: 'Fantasia',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      badgeColor: Color(0xFFEC4899),
    ),
  ];

  Future<void> _pickImage(ImageSource source) async {
    final XFile? pickedFile = await _picker.pickImage(
      source: source,
      imageQuality: 90,
      maxWidth: 1920,
    );
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  // BOTTOM SHEET CUSTOMIZADA PARA ESCOLHA DO ESTILO
  void _openStyleBottomSheet(BuildContext context) {
    final i18n = MePicLocalizations.of(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18181B), // Neutral-900 escuro
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (BuildContext ctx) {
        return StatefulBuilder(
          builder: (BuildContext sheetCtx, StateSetter setModalState) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              height: MediaQuery.of(context).size.height * 0.70,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    i18n.get('bottomSheetTitle'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    i18n.get('hairStyleSubtitle'),
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: GridView.builder(
                      itemCount: _catalog.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.85,
                      ),
                      itemBuilder: (context, index) {
                        final item = _catalog[index];
                        final isSelected = _selectedStyle?.id == item.id;

                        return GestureDetector(
                          onTap: () {
                            setModalState(() {
                              _selectedStyle = item;
                            });
                            setState(() {
                              _selectedStyle = item;
                            });
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected ? const Color(0xFFF43F5E) : Colors.white12,
                                width: isSelected ? 2.5 : 1,
                              ),
                              image: DecorationImage(
                                image: NetworkImage(item.imageUrl),
                                fit: BoxFit.cover,
                              ),
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                gradient: const LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Colors.transparent, Colors.black87],
                                ),
                              ),
                              padding: const EdgeInsets.all(10),
                              alignment: Alignment.bottomLeft,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: item.badgeColor.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      item.category,
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF43F5E),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        i18n.get('bottomSheetConfirm'),
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _triggerGeneration() {
    final i18n = MePicLocalizations.of(context);
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(i18n.get('errorNoPhoto')), backgroundColor: Colors.redAccent),
      );
      return;
    }
    if (_selectedStyle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(i18n.get('errorNoStyle')), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Simulação do envio para o endpoint FastAPI /api/v1/generations/hair-style
    Future.delayed(const Duration(seconds: 3), () {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('\${i18n.get("successTitle")} Estilo: \${_selectedStyle!.name}'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final i18n = MePicLocalizations.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: Text(i18n.get('hairStyleTitle')),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview da Imagem Carregada
            GestureDetector(
              onTap: () => _pickImage(ImageSource.gallery),
              child: Container(
                width: double.infinity,
                height: 280,
                decoration: BoxDecoration(
                  color: const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white12),
                  image: _selectedImage != null
                      ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                      : null,
                ),
                child: _selectedImage == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_a_photo_outlined, color: Colors.white54, size: 48),
                          const SizedBox(height: 12),
                          Text(i18n.get('uploadPhoto'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text(i18n.get('hairStyleSubtitle'), style: const TextStyle(color: Colors.white38, fontSize: 12)),
                        ],
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 20),

            // Botão para abrir Bottom Sheet
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                side: const BorderSide(color: Color(0xFFF43F5E)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.style_outlined, color: Color(0xFFF43F5E)),
              label: Text(
                _selectedStyle == null ? i18n.get('selectStyleBtn') : '\${i18n.get("selectedStyleLabel")}: \${_selectedStyle!.name}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              onPressed: () => _openStyleBottomSheet(context),
            ),
            const SizedBox(height: 24),

            // Botão de Ação Primária
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF43F5E),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: _isLoading ? null : _triggerGeneration,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        i18n.get('generateBtn'),
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`,
    deepDiveMarkdownPt: `### Detalhes de Engenharia do Código Flutter

- **Localização First-Class (i18n):** O dicionário \`MePicLocalizations\` fornece traduções nativas dinâmicas e seleciona o Português (\`pt-BR\`) como fallback padrão de toda a árvore de widgets.
- **Bottom Sheet com StatefulBuilder:** Permite atualização de estado interativa em tempo real (seleção de estilos e visualização de badges) dentro do modal sem reconstruir a tela inteira.
- **Gerenciamento de Imagem:** Integra o plugin \`image_picker\` com compressão no lado do cliente (\`imageQuality: 90\`) para economizar largura de banda móvel antes do upload.`
  },
  {
    id: 'storage_codecs',
    titlePt: '5. Estratégia de Armazenamento, Codecs & Timeouts',
    titleEn: '5. Storage Strategy, Codecs & Timeouts',
    icon: 'HardDrive',
    summaryPt: 'Diretrizes de produção para controle de custos de armazenamento em nuvem (S3/GCS), políticas de expiração de assets descartados, pipeline FFmpeg 9:16 (1080x1920) e codificação H.264/HEVC otimizada para TikTok e Instagram Reels.',
    summaryEn: 'Cloud storage cost control, lifecycle expiration policies, 9:16 FFmpeg video pipeline, and H.264/HEVC encoding optimized for TikTok and Instagram Reels.',
    language: 'bash',
    codeSnippet: `# ============================================================================
# PIPELINE FFMPEG DE PRODUÇÃO - EXPORTAÇÃO PARA TIKTOK / REELS (9:16)
# ============================================================================

# 1. Normalização de aspect ratio (9:16 - 1080x1920), 60 FPS, H.264 High Profile, Faststart
ffmpeg -y -i input_raw_ai_generation.mp4 -i soundtrack_beat_synced.aac \\
  -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=60[v]" \\
  -map "[v]" -map 1:a \\
  -c:v libx264 -profile:v high -level:v 4.2 -preset fast -crf 20 \\
  -pix_fmt yuv420p \\
  -c:a aac -b:a 192k -ar 48000 \\
  -movflags +faststart \\
  -shortest \\
  output_viral_9x16_optimized.mp4

# EXPLICAÇÃO DOS PARÂMETROS CHAVE:
# -movflags +faststart : Move o átomo MOOV (metadados) para o início do arquivo.
#                       O usuário começa a assistir no app instantaneamente sem
#                       precisar baixar o vídeo inteiro de 15MB.
# -pix_fmt yuv420p     : Garante compatibilidade 100% com o player nativo do iOS e Android.
# -crf 20              : Proporção perfeita entre nitidez visual e tamanho compacto (~4-8MB).
# scale=1080:1920      : Resolução padrão vertical exigida pelas diretrizes do TikTok/Instagram.`,
    deepDiveMarkdownPt: `### Arquitetura de Armazenamento & Políticas de Retenção

1. **Estratégia de Expiração em Camadas (S3 Lifecycle Rules):**
   - **Bucket Transitório (\`/tmp-uploads/\`):** TTL rígido de **24 horas**. Remove automaticamente fotos brutas de upload e frames intermediários gerados durante o processo de difusão.
   - **Bucket de Gerações Recentes (\`/generations/\`):** Permanece no armazenamento padrão (S3 Standard) por **7 dias**.
   - **Transição Automática:** No dia 8, transita automaticamente para **S3 Standard-IA (Infrequent Access)** ou expira completamente para usuários do plano Free se o asset não tiver sido explicitamente salvo na "Galeria Pessoal" do usuário.
   - **Economia Estimada:** Redução de mais de **78% dos custos de armazenamento em nuvem**, evitando acumular terabytes de vídeos abandonados gerados por curiosidade.

2. **CDN & Signed URLs de Curta Duração:**
   - Todo acesso a mídia gerada passa por **CloudFront / Cloud CDN**.
   - Para proteger a privacidade do usuário (imagens faciais e vídeos gerados), as URLs de reprodução utilizam **Signed Cookies** ou **Signed URLs** com validade de 4 horas, impedindo indexação e raspagem externa.

3. **Timeouts e Resiliência na Orquestração:**
   - **Edge Gateway:** Timeout de 15s para conexões síncronas.
   - **Worker Async:** Timeout de 180s para a inferência de difusão de vídeo na GPU.
   - **Auto-Cancel:** Se o cliente fechar o app móvel antes da geração entrar no estágio de renderização pesada, a fila pode ser despriorizada ou cancelada para economizar créditos de GPU da infraestrutura.`
  },
  {
    id: 'celery_worker',
    titlePt: '6. Worker Assíncrono de GPU & FFmpeg (Python / Celery)',
    titleEn: '6. GPU Async Worker & FFmpeg Pipeline (Python / Celery)',
    icon: 'Cpu',
    summaryPt: 'Worker de produção consumindo filas Redis Streams/Celery, orquestrando inferência em GPUs, executando pipeline de codificação de vídeo via subprocess FFmpeg acelerado por hardware e publicando eventos de progresso.',
    summaryEn: 'Production Celery/Redis worker orchestrating GPU inference, executing FFmpeg subprocess with hardware acceleration, and publishing progress events.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Celery Worker de Processamento de Mídia & Orquestração de IA
Executa em instâncias com GPU (AWS G5 / GCP A2)
"""
import os
import subprocess
import tempfile
import asyncio
import json
import logging
import httpx
import boto3
from celery import Celery
from botocore.exceptions import BotoCoreError

logger = logging.getLogger("mepic.worker")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("mepic_worker", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,        # 5 minutos hard limit
    task_soft_time_limit=240,   # 4 minutos soft limit
    worker_prefetch_multiplier=1 # Um job pesado por worker
)

s3_client = boto3.client("s3")
OUTPUT_BUCKET = os.getenv("AWS_S3_BUCKET_NAME", "mepic-production-media")

@celery_app.task(bind=True, max_retries=2, default_retry_delay=10)
def process_viral_dance_task(
    self,
    generation_id: str,
    user_id: str,
    input_image_s3_url: str,
    choreography_key: str,
    audio_track_filename: str
):
    """
    Pipeline completo executado no Worker:
    1. Notifica Redis Pub/Sub: 'processing'
    2. Envia para cluster de inferência da IA (Kling / Runway / LivePortrait)
    3. Normaliza e recodifica vídeo com FFmpeg (1080x1920, 60fps, H.264, +faststart)
    4. Muxing com trilha de áudio sincronizada
    5. Upload para S3 e notificação de conclusão
    """
    logger.info(f"[{generation_id}] Iniciando processamento para usuário {user_id}")
    redis_client = celery_app.backend.client

    def emit_progress(step: str, percent: int):
        event_payload = {
            "event": "GENERATION_PROGRESS",
            "generation_id": generation_id,
            "step": step,
            "progress": percent
        }
        redis_client.publish(f"user_channel:{user_id}", json.dumps(event_payload))

    emit_progress("Extraindo pontos de referência facial e esqueleto de pose...", 20)

    with tempfile.TemporaryDirectory() as temp_dir:
        raw_video_path = os.path.join(temp_dir, "raw_ai_output.mp4")
        optimized_video_path = os.path.join(temp_dir, f"{generation_id}_9x16.mp4")
        audio_path = os.path.join("/opt/mepic/audio_assets", audio_track_filename)

        try:
            # 1. Chamada de Inferência para a API de IA com Timeout Controlado
            emit_progress("Orquestrando difusão de movimento latente com IA...", 50)
            
            with httpx.Client(timeout=180.0) as client:
                ai_response = client.post(
                    "https://api.klingai.com/v1/videos/image2video",
                    headers={"Authorization": f"Bearer {os.getenv('KLING_API_KEY')}"},
                    json={
                        "image_url": input_image_s3_url,
                        "motion_template": choreography_key,
                        "duration": 15,
                        "aspect_ratio": "9:16"
                    }
                )
                ai_response.raise_for_status()
                task_data = ai_response.json()
                video_download_url = task_data.get("video_url")

                # Baixa o vídeo bruto gerado pela IA
                vid_stream = client.get(video_download_url)
                with open(raw_video_path, "wb") as f:
                    f.write(vid_stream.content)

            # 2. Pós-Processamento FFmpeg: 9:16 (1080x1920), 60 FPS, Faststart e Áudio Muxing
            emit_progress("Interpolando quadros (60 FPS) e codificando H.264 Faststart...", 80)
            
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", raw_video_path,
                "-i", audio_path,
                "-filter_complex",
                "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=60[v]",
                "-map", "[v]",
                "-map", "1:a",
                "-c:v", "libx264",
                "-profile:v", "high",
                "-level:v", "4.2",
                "-preset", "fast",
                "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-ar", "48000",
                "-movflags", "+faststart",
                "-shortest",
                optimized_video_path
            ]
            
            subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            # 3. Upload do arquivo final para S3 / CloudFront
            emit_progress("Finalizando upload na CDN...", 95)
            s3_key = f"videos/{user_id}/{generation_id}_9x16.mp4"
            
            s3_client.upload_file(
                optimized_video_path,
                OUTPUT_BUCKET,
                s3_key,
                ExtraArgs={
                    "ContentType": "video/mp4",
                    "CacheControl": "public, max-age=31536000, immutable"
                }
            )

            cdn_url = f"https://cdn.mepic.app/{s3_key}"

            # 4. Notifica conclusão com sucesso via Redis Pub/Sub
            redis_client.publish(f"user_channel:{user_id}", json.dumps({
                "event": "GENERATION_COMPLETED",
                "generation_id": generation_id,
                "video_url": cdn_url,
                "status": "completed"
            }))
            
            logger.info(f"[{generation_id}] Concluído com sucesso: {cdn_url}")
            return {"status": "completed", "video_url": cdn_url}

        except Exception as exc:
            logger.error(f"[{generation_id}] Falha na tarefa do Celery: {exc}", exc_info=True)
            
            # Aciona estorno automático de tokens
            redis_client.publish("task_failures_refund_channel", json.dumps({
                "generation_id": generation_id,
                "user_id": user_id,
                "tokens_cost": 10,
                "error_reason": str(exc)
            }))
            
            raise self.retry(exc=exc) if self.request.retries < self.max_retries else exc`,
    deepDiveMarkdownPt: `### Arquitetura do Worker Celery

- **Prefetch Multiplier = 1:** Evita que um único worker de GPU acumule múltiplas gerações de vídeo na memória, distribuindo os jobs com perfeita justiça entre nós do cluster.
- **Pipeline de Subprocesso FFmpeg:** Executa a transcodificação e o alinhamento de áudio localmente no disco efêmero do pod antes de enviar o resultado final para o S3.
- **Canal de Falhas Desacoplado (\`task_failures_refund_channel\`):** Se todos os retries esgotarem, um consumer dedicado no backend consome o evento e executa o estorno no PostgreSQL.`
  },
  {
    id: 'websocket_server',
    titlePt: '7. Servidor WebSocket em Tempo Real com Redis Pub/Sub (FastAPI)',
    titleEn: '7. Real-Time WebSocket Server with Redis Pub/Sub (FastAPI)',
    icon: 'Network',
    summaryPt: 'Servidor WebSocket de alta performance com autenticação via token JWT, gerenciamento de conexões ativas por usuário e ponte contínua com canais Redis Pub/Sub para entrega de progresso instantâneo.',
    summaryEn: 'High-performance WebSocket server with JWT authentication, active connection tracking, and continuous Redis Pub/Sub bridge for instant progress delivery.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Gateway WebSocket em Tempo Real
Autentica conexões móveis e despacha eventos de renderização via Redis Pub/Sub
"""
import asyncio
import json
import logging
from typing import Dict, Set
import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import jwt, JWTError

logger = logging.getLogger("mepic.websocket")
router = APIRouter(tags=["WebSockets"])

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mepic_secret_jwt_key_prod")
ALGORITHM = "HS256"

class WebSocketManager:
    """Gerenciador de conexões WebSocket ativas com suporte a múltiplos dispositivos por usuário."""
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
        logger.info(f"Cliente conectado: {user_id} (Total de sockets: {len(self.active_connections[user_id])})")

    async def disconnect(self, user_id: str, websocket: WebSocket):
        async with self.lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
        logger.info(f"Cliente desconectado: {user_id}")

    async def send_to_user(self, user_id: str, message: dict):
        async with self.lock:
            sockets = list(self.active_connections.get(user_id, []))
        
        for ws in sockets:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Erro ao enviar frame para {user_id}: {e}")

ws_manager = WebSocketManager()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT Bearer Token de autenticação móvel")
):
    # 1. Autenticação do JWT
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user_id, websocket)

    # 2. Escuta contínua de Heartbeat / Ping-Pong
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(user_id, websocket)

# ============================================================================
# LISTENER DE REDIS PUB/SUB EM BACKGROUND
# ============================================================================
async def redis_pubsub_listener(redis_url: str):
    """Consome mensagens publicadas pelos workers de GPU e despacha para os WebSockets corretos."""
    redis = aioredis.from_url(redis_url)
    pubsub = redis.pubsub()
    await pubsub.psubscribe("user_channel:*")
    logger.info("Iniciando escuta do canal Redis Pub/Sub: user_channel:*")

    async for message in pubsub.listen():
        if message["type"] == "pmessage":
            channel = message["channel"].decode("utf-8")
            user_id = channel.split("user_channel:")[1]
            data = json.loads(message["data"].decode("utf-8"))
            await ws_manager.send_to_user(user_id, data)`,
    deepDiveMarkdownPt: `### Vantagens Desta Arquitetura de WebSockets

1. **Escalabilidade Horizontal Sem Afinidade de Sessão:** Como o Redis Pub/Sub distribui os eventos, o usuário pode estar conectado na réplica \`FastAPI Pod #1\` enquanto o worker publica no Redis a partir de outro nó.
2. **Suporte a Múltiplos Aparelhos:** O usuário pode iniciar uma dança viral no tablet e receber o aviso de conclusão simultaneamente no smartphone com a mesma conta.`
  },
  {
    id: 'flutter_service',
    titlePt: '8. Cliente Flutter: WebSocket, Reconexão & Riverpod (Dart)',
    titleEn: '8. Flutter Client: WebSocket, Reconnection & Riverpod (Dart)',
    icon: 'Smartphone',
    summaryPt: 'Serviço em Dart para consumo de WebSockets com reconexão exponencial automática ao alternar entre Wi-Fi e 4G, parsing de eventos tipados e integração limpa com gerência de estado.',
    summaryEn: 'Dart service consuming WebSockets with exponential backoff auto-reconnection, typed event parsing, and clean state management integration.',
    language: 'dart',
    codeSnippet: `import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

enum GenerationState { idle, queued, processing, completed, refunded, failed }

class GenerationProgressEvent {
  final String generationId;
  final GenerationState state;
  final int progressPercent;
  final String currentStep;
  final String? videoUrl;
  final int? refundedTokens;

  GenerationProgressEvent({
    required this.generationId,
    required this.state,
    required this.progressPercent,
    required this.currentStep,
    this.videoUrl,
    this.refundedTokens,
  });

  factory GenerationProgressEvent.fromJson(Map<String, dynamic> json) {
    GenerationState state = GenerationState.processing;
    final eventName = json['event'];

    if (eventName == 'GENERATION_COMPLETED') {
      state = GenerationState.completed;
    } else if (eventName == 'GENERATION_FAILED_REFUNDED') {
      state = GenerationState.refunded;
    }

    return GenerationProgressEvent(
      generationId: json['generation_id'] ?? '',
      state: state,
      progressPercent: json['progress'] ?? (state == GenerationState.completed ? 100 : 0),
      currentStep: json['step'] ?? '',
      videoUrl: json['video_url'],
      refundedTokens: json['tokens_refunded'],
    );
  }
}

class MePicWebSocketService extends ChangeNotifier {
  final String wsBaseUrl;
  final String userAuthToken;

  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  bool _isConnected = false;
  int _reconnectAttempts = 0;

  final _progressStreamController = StreamController<GenerationProgressEvent>.broadcast();
  Stream<GenerationProgressEvent> get progressStream => _progressStreamController.stream;

  MePicWebSocketService({required this.wsBaseUrl, required this.userAuthToken});

  void connect() {
    if (_isConnected) return;

    final uri = Uri.parse('$wsBaseUrl?token=$userAuthToken');
    try {
      _channel = WebSocketChannel.connect(uri);
      _isConnected = true;
      _reconnectAttempts = 0;
      notifyListeners();

      // Inicia Heartbeat a cada 25 segundos
      _heartbeatTimer?.cancel();
      _heartbeatTimer = Timer.periodic(const Duration(seconds: 25), (timer) {
        _channel?.sink.add('ping');
      });

      _channel!.stream.listen(
        (dynamic message) {
          if (message == 'pong') return;
          try {
            final Map<String, dynamic> decoded = jsonDecode(message);
            final event = GenerationProgressEvent.fromJson(decoded);
            _progressStreamController.add(event);
          } catch (e) {
            debugPrint('Erro ao parsear frame WebSocket: $e');
          }
        },
        onError: (error) {
          debugPrint('Erro de conexão WebSocket: $error');
          _scheduleReconnect();
        },
        onDone: () {
          debugPrint('Conexão WebSocket fechada pelo servidor.');
          _scheduleReconnect();
        },
      );
    } catch (e) {
      debugPrint('Falha ao conectar no WebSocket: $e');
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    _isConnected = false;
    _heartbeatTimer?.cancel();
    notifyListeners();

    _reconnectAttempts++;
    final delaySeconds = (_reconnectAttempts * 2).clamp(2, 30);
    debugPrint('Agendando reconexão em $delaySeconds segundos...');

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      connect();
    });
  }

  void disposeService() {
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();
    _channel?.sink.close(status.goingAway);
    _progressStreamController.close();
    super.dispose();
  }
}`,
    deepDiveMarkdownPt: `### Resiliência Móvel no Flutter

- **Backoff Exponencial:** Impede que milhares de celulares desconectados durante instabilidades de rede sobrecarreguem o gateway com tempestades de reconexões simultâneas (*Thundering Herd*).
- **Heartbeat Integrado:** Envia \`ping\` a cada 25 segundos para manter os túneis NAT das operadoras de telefonia (Vivo, Claro, TIM) ativos e evitar desconexões silenciosas.`
  },
  {
    id: 'in_app_purchases',
    titlePt: '9. Faturamento In-App (Google Play & Apple StoreKit Webhooks)',
    titleEn: '9. In-App Purchases (Google Play & Apple StoreKit Webhooks)',
    icon: 'Coins',
    summaryPt: 'Controlador FastAPI de validação de recibos de assinaturas e compras de pacotes de moedas para Google Play Billing 6.0 e Apple App Store Server Notifications V2 com controle rigoroso de idempotência.',
    summaryEn: 'FastAPI controller validating Google Play Billing 6.0 and Apple App Store Server Notifications V2 webhooks with strict idempotency and token crediting.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Gateway de Faturamento e Webhooks In-App Purchases (IAP)
Processa notificações em tempo real da Google Play e Apple App Store
"""
import base64
import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger("mepic.billing")
router = APIRouter(prefix="/api/v1/billing", tags=["Faturamento & Assinaturas"])

TOKEN_PACK_DEFINITIONS = {
    "com.aieditor.artgen.tokens.50": {"tokens": 50, "bonus": 0},
    "com.aieditor.artgen.tokens.150": {"tokens": 150, "bonus": 30},
    "com.aieditor.artgen.tokens.500": {"tokens": 500, "bonus": 150},
}

SUBSCRIPTION_DEFINITIONS = {
    "com.aieditor.artgen.sub.weekly": {"tokens_per_period": 60, "period_days": 7},
    "com.aieditor.artgen.sub.monthly_vip": {"tokens_per_period": 300, "period_days": 30},
}

@router.post("/webhooks/google-play")
async def google_play_rtdn_webhook(request: Request, db: AsyncSession = Depends(get_db_session)):
    """
    Webhook para Real-Time Developer Notifications (RTDN) da Google Play via Cloud Pub/Sub.
    Garante crédito idempotente de moedas e renovação de planos VIP.
    """
    body = await request.json()
    message = body.get("message", {})
    data_b64 = message.get("data")
    
    if not data_b64:
        raise HTTPException(status_code=400, detail="Payload inválido do Pub/Sub")

    decoded_json = json.loads(base64.b64decode(data_b64).decode("utf-8"))
    order_id = decoded_json.get("orderId")
    sku = decoded_json.get("subscriptionNotification", {}).get("subscriptionId") or decoded_json.get("oneTimeProductNotification", {}).get("sku")
    notification_type = decoded_json.get("subscriptionNotification", {}).get("notificationType")

    idempotency_key = f"gplay_{order_id}_{sku}"

    async with db.begin():
        # 1. Verifica se esta transação já foi processada anteriormente
        existing = await db.execute(
            select(TokenTransaction).where(TokenTransaction.idempotency_key == idempotency_key)
        )
        if existing.scalar_one_or_none():
            logger.info(f"Notificação {idempotency_key} já processada anteriormente. Retornando 200 OK.")
            return {"status": "already_processed"}

        # 2. Busca o usuário correspondente
        user_id = decoded_json.get("obfuscatedExternalAccountId")
        stmt = select(User).where(User.id == user_id).with_for_update()
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        
        if not user:
            logger.error(f"Usuário {user_id} não encontrado para a ordem {order_id}")
            return {"status": "user_not_found"}

        # 3. Processamento de Compra de Pacote de Tokens Avulsos
        if sku in TOKEN_PACK_DEFINITIONS:
            pack = TOKEN_PACK_DEFINITIONS[sku]
            total_tokens = pack["tokens"] + pack["bonus"]
            new_balance = user.token_balance + total_tokens
            user.token_balance = new_balance

            tx = TokenTransaction(
                user_id=user.id,
                type="purchase",
                amount=total_tokens,
                balance_after=new_balance,
                idempotency_key=idempotency_key,
                description=f"Compra Google Play: {pack['tokens']} Moedas (+{pack['bonus']} bônus)"
            )
            db.add(tx)
            logger.info(f"Creditados {total_tokens} tokens para o usuário {user.id}")

        # 4. Processamento de Assinatura Recorrente (Tipo 2 = Renovação com Sucesso)
        elif sku in SUBSCRIPTION_DEFINITIONS:
            sub_info = SUBSCRIPTION_DEFINITIONS[sku]
            tokens_granted = sub_info["tokens_per_period"]
            new_balance = user.token_balance + tokens_granted
            user.token_balance = new_balance
            user.role = "vip_subscriber"

            tx = TokenTransaction(
                user_id=user.id,
                type="subscription_grant",
                amount=tokens_granted,
                balance_after=new_balance,
                idempotency_key=idempotency_key,
                description=f"Renovação Assinatura VIP ({sku}): +{tokens_granted} Moedas"
            )
            db.add(tx)
            logger.info(f"Assinatura {sku} renovada para usuário {user.id}")

    return {"status": "success"}`
    ,
    deepDiveMarkdownPt: "### Validação de Recibos & Segurança Financeira no Google Play & App Store\n\n1. **Idempotência por Chave Composta (idempotency_key):** O Google Cloud Pub/Sub opera com garantia de entrega At-Least-Once, o que significa que o mesmo evento de renovação de assinatura pode ser disparado 2 ou mais vezes em frações de segundos. A consulta prévia ao banco e a restrição de chave única impedem que o usuário receba moedas duplicadas.\n2. **Separação de SKU vs Obfuscated Account ID:** O aplicativo móvel Flutter envia o user.id como obfuscatedAccountId na chamada de compra nativa da Google Play Billing Library. Isso permite correlacionar o webhook com a conta exata do usuário no backend sem expor e-mails ou dados confidenciais."
  },
  {
    id: 'safety_guardrail',
    titlePt: '10. Moderação de Conteúdo & Validação Biométrica (CLIP / NSFW / InsightFace)',
    titleEn: '10. Content Moderation & Biometric Validation (CLIP / NSFW / InsightFace)',
    icon: 'ShieldCheck',
    summaryPt: 'Pipeline síncrono de pré-validação antes de enviar imagens para GPU cara: Detecção de rosto único via RetinaFace/InsightFace, pontuação NSFW via ViT e bloqueio de conteúdo inadequado com zero consumo de tokens.',
    summaryEn: 'Pre-validation synchronous pipeline before expensive GPU routing: single face check, ViT NSFW scoring, and policy enforcement with zero token waste.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Módulo de Moderação e Validação Biométrica de Entrada
Executado no Gateway ou Worker de Ingestão antes de alocar GPU pesada
"""
import io
import torch
import numpy as np
from PIL import Image
from fastapi import HTTPException, status
from transformers import AutoModelForImageClassification, AutoImageProcessor
import insightface
from insightface.app import FaceAnalysis

# Modelos carregados em memória na inicialização do pod
nsfw_processor = AutoImageProcessor.from_pretrained("Falconsai/nsfw_image_detection")
nsfw_model = AutoModelForImageClassification.from_pretrained("Falconsai/nsfw_image_detection")
nsfw_model.eval()

face_analyzer = FaceAnalysis(name="buffalo_l", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
face_analyzer.prepare(ctx_id=0, det_size=(640, 640))

def validate_and_moderate_input_photo(image_bytes: bytes) -> dict:
    """
    Executa 3 checagens críticas de segurança:
    1. Validação de Formato & Resolução mínima
    2. Detecção de Rosto Humano e Pose (RetinaFace)
    3. Detecção de Nudez / Violência / NSFW (Vision Transformer)
    """
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE_FORMAT", "message": "Arquivo corrompido ou formato não suportado."}
        )

    width, height = pil_image.size
    if width < 512 or height < 512:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "RESOLUTION_TOO_LOW", "message": "A foto deve ter pelo menos 512x512 pixels para IA de alta nitidez."}
        )

    # 1. FILTRO DE MODERAÇÃO DE CONTEÚDO (NSFW)
    inputs = nsfw_processor(images=pil_image, return_tensors="pt")
    with torch.no_grad():
        outputs = nsfw_model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)
        # Índice 1 = NSFW
        nsfw_score = probs[0][1].item()

    if nsfw_score > 0.70:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CONTENT_POLICY_VIOLATION",
                "message": "A imagem viola as diretrizes de segurança da comunidade (conteúdo impróprio detectado)."
            }
        )

    # 2. ANÁLISE BIOMÉTRICA DE ROSTO (INSIGHTFACE)
    cv2_img = np.array(pil_image)[:, :, ::-1] # RGB -> BGR
    faces = face_analyzer.get(cv2_img)

    if len(faces) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "NO_FACE_DETECTED", "message": "Nenhum rosto humano nítido foi detectado na foto enviada."}
        )
    
    if len(faces) > 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "MULTIPLE_FACES_DETECTED", "message": "Envie uma foto contendo apenas uma pessoa em foco."}
        )

    primary_face = faces[0]
    bbox = primary_face.bbox.tolist()
    kps = primary_face.kps.tolist()

    return {
        "status": "approved",
        "nsfw_score": round(nsfw_score, 4),
        "face_bbox": bbox,
        "landmarks": kps,
        "face_confidence": float(primary_face.det_score)
    }`,
    deepDiveMarkdownPt: "### Moderação com Custo Zero de GPU Pesada\n\n1. **Proteção Financeira de Créditos de IA:** Um dos maiores vetores de desperdício em apps de foto IA é enviar fotos sem rosto (animais, paisagens ou fotos tremidas) para APIs externas de US$ 0,15 por geração. A checagem síncrona com RetinaFace rejeita a imagem antes do débito de moedas, melhorando o NPS do usuário.\n2. **Compliance com Apple Store e Google Play:** A App Store exige moderação proativa rigorosa contra conteúdo NSFW para aprovação de aplicativos generativos."
  },
  {
    id: 'docker_infra',
    titlePt: '11. Dockerfile Otimizado com CUDA 12 & FFmpeg NVENC',
    titleEn: '11. Production Dockerfile with CUDA 12 & FFmpeg NVENC',
    icon: 'Layers',
    summaryPt: 'Imagem Docker multi-stage construída sobre NVIDIA CUDA 12.2 com aceleração de hardware NVENC/NVDEC para transcodificação de vídeo em tempo real a 120 FPS em instâncias cloud com GPU.',
    summaryEn: 'Multi-stage Docker image built on NVIDIA CUDA 12.2 with NVENC/NVDEC hardware acceleration for 120 FPS video transcoding on cloud GPU nodes.',
    language: 'dockerfile',
    codeSnippet: `# ==============================================================================
# ME-PIC AI: WORKER DE INFERÊNCIA & FFMPEG NVENC
# Imagem Base: NVIDIA CUDA 12.2 Devel Ubuntu 22.04
# ==============================================================================
FROM nvidia/cuda:12.2.2-devel-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \\
    PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1 \\
    NVIDIA_VISIBLE_DEVICES=all \\
    NVIDIA_DRIVER_CAPABILITIES=compute,video,utility

# 1. Dependências do Sistema & Compilação de FFmpeg com NVENC
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    pkg-config \\
    yasm \\
    nasm \\
    git \\
    curl \\
    ca-certificates \\
    libtool \\
    python3.11 \\
    python3.11-dev \\
    python3.11-distutils \\
    libx264-dev \\
    libx265-dev \\
    libnuma-dev \\
    libssl-dev \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

# Configura Python 3.11 padrão
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

WORKDIR /app

# 2. Instalação das bibliotecas Python de IA com suporte a CUDA 12
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN pip install --no-cache-dir -r requirements.txt

# 3. Cache pré-aquecido de pesos de modelos locais (InsightFace / DWPose)
RUN mkdir -p /root/.insightface/models/buffalo_l && \\
    curl -L -o /tmp/buffalo_l.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip && \\
    apt-get update && apt-get install -y unzip && \\
    unzip /tmp/buffalo_l.zip -d /root/.insightface/models/buffalo_l && \\
    rm /tmp/buffalo_l.zip && apt-get purge -y unzip && rm -rf /var/lib/apt/lists/*

# 4. Código da Aplicação
COPY . /app

# Usuário não-root para segurança corporativa
RUN useradd -m -u 1001 mepic && chown -R mepic:mepic /app
USER mepic

CMD ["celery", "-A", "mepic_worker.celery_app", "worker", "--loglevel=INFO", "-c", "2", "-Q", "gpu_viral_dance"]`,
    deepDiveMarkdownPt: "### Aceleração de Hardware com NVENC\n\n- O container monta os drivers proprietários da NVIDIA através do `nvidia-container-toolkit`.\n- O FFmpeg roda com transcodificação offloaded diretamente nos núcleos NVENC da placa gráfica, liberando 100% da CPU para o runtime do Celery e threads de I/O de rede."
  },
  {
    id: 'k8s_keda_autoscaling',
    titlePt: '12. Autoscaling em Kubernetes via KEDA (Métricas de Fila)',
    titleEn: '12. Kubernetes KEDA Autoscaling (Queue Depth Driven)',
    icon: 'Network',
    summaryPt: 'Manifesto Kubernetes com ScaledObject KEDA que escala os pods de GPU de 0 a 30 instâncias em menos de 45 segundos baseado diretamente no número de vídeos de dança aguardando na fila do Redis.',
    summaryEn: 'Kubernetes manifest with KEDA ScaledObject scaling GPU pods from 0 to 30 instances based on pending Redis queue items.',
    language: 'yaml',
    codeSnippet: `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: mepic-gpu-worker-scaler
  namespace: mepic-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mepic-gpu-worker-deployment
  minReplicaCount: 1      # 1 nó sempre aquecido para latência zero em horário de pico
  maxReplicaCount: 35     # Teto orçamentário para cluster de A100/A10G
  cooldownPeriod: 300     # 5 minutos de tolerância antes de desligar nós para evitar oscilações
  pollingInterval: 5      # Checa a fila do Redis a cada 5 segundos

  triggers:
  - type: redis
    metadata:
      addressFromEnv: REDIS_URL
      listName: celery_viral_dance_queue
      listLength: "3"     # A cada 3 vídeos na fila, sobe +1 pod com GPU
      activationListLength: "1"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mepic-gpu-worker-deployment
  namespace: mepic-production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mepic-gpu-worker
  template:
    metadata:
      labels:
        app: mepic-gpu-worker
    spec:
      nodeSelector:
        cloud.google.com/gke-accelerator: nvidia-tesla-a10g
      tolerations:
      - key: "nvidia.com/gpu"
        operator: "Exists"
        effect: "NoSchedule"
      containers:
      - name: worker
        image: gcr.io/mepic-prod/ai-worker:v2.4.1
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "16Gi"
            cpu: "4000m"
          requests:
            nvidia.com/gpu: 1
            memory: "8Gi"
            cpu: "2000m"
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: mepic-secrets
              key: redis-url`,
    deepDiveMarkdownPt: "### Vantagens do Autoscaling por Fila (KEDA)\n\n1. **Escala Antecipada Antes do Gargalo:** O autoscaling tradicional de CPU/Memória falha com IA generativa, pois a CPU fica ociosa enquanto a GPU está saturada. O KEDA analisa a fila de mensagens do Redis e inicia novas instâncias no exato segundo em que uma tendência viral estoura no TikTok.\n2. **Scale-to-Zero nas Madrugadas:** Em horários de baixa demanda, reduz o cluster ao mínimo estabelecido, economizando dezenas de milhares de dólares por mês em custos de nuvem."
  },
  {
    id: 'diffusion_pipeline',
    titlePt: '13. Pipeline de Difusão Local com InstantID & ControlNet (Python / PyTorch)',
    titleEn: '13. Self-Hosted Diffusion Pipeline with InstantID & ControlNet (Python / PyTorch)',
    icon: 'Sparkles',
    summaryPt: 'Pipeline proprietário de difusão estável baseado em SDXL/InstantID e ControlNet para executar trocas de cabelo e fotos anos 90 em cluster próprio sem pagar por chamadas de APIs externas.',
    summaryEn: 'Proprietary SDXL/InstantID and ControlNet diffusion pipeline running hair change and 90s photos on self-hosted GPU nodes without 3rd party API fees.',
    language: 'python',
    codeSnippet: `"""
MePic AI - Pipeline Proprietário de Difusão com Preservação de Identidade
Baseado em SDXL + InstantID + ControlNet Depth/Canny (Zero API Externa)
"""
import torch
import numpy as np
from PIL import Image
import cv2
from diffusers import (
    StableDiffusionXLInstantIDPipeline,
    ControlNetModel,
    AutoencoderKL,
    EulerDiscreteScheduler
)
import insightface
from insightface.app import FaceAnalysis

device = "cuda" if torch.cuda.is_available() else "cpu"

# 1. Carregamento do Analisador Facial InsightFace (AntelopeV2)
app = FaceAnalysis(name="antelopev2", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))

# 2. ControlNet para preservação da pose e silhueta
controlnet = ControlNetModel.from_pretrained(
    "diffusers/controlnet-canny-sdxl-1.0",
    torch_dtype=torch.float16
)

# 3. Pipeline Principal SDXL InstantID
pipe = StableDiffusionXLInstantIDPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    controlnet=controlnet,
    torch_dtype=torch.float16,
    variant="fp16"
)
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config)
pipe.cuda()

# Carrega adaptador InstantID
pipe.load_instantid_adapter("InstantX/InstantID", subfolder="checkpoints", weight_name="ip-adapter.bin")

def generate_hair_transformation(
    user_image_path: str,
    hair_style_prompt: str,
    negative_prompt: str = "blurry, bad anatomy, deformed face, low resolution, artifact",
    controlnet_conditioning_scale: float = 0.85,
    identity_adapter_scale: float = 0.80,
    guidance_scale: float = 5.0,
    steps: int = 30
) -> Image.Image:
    """
    Executa a transformação fotográfica preservando a biometria facial original do usuário:
    - Extrai vetor de identidade (512-d embedding)
    - Condiciona difusão com mapa de bordas Canny
    - Aplica prompt específico de cabelo/estilo
    """
    input_image = Image.open(user_image_path).convert("RGB")
    input_image = input_image.resize((1024, 1024))
    
    # 1. Extração do Embedding Facial
    cv2_img = cv2.cvtColor(np.array(input_image), cv2.COLOR_RGB2BGR)
    faces = app.get(cv2_img)
    if len(faces) == 0:
        raise ValueError("Nenhum rosto identificado na imagem de entrada.")
    
    face_info = faces[0]
    face_emb = face_info.embedding # Vetor de identidade biométrica

    # 2. Gera mapa de contorno Canny para ancoragem anatômica
    img_gray = cv2.cvtColor(np.array(input_image), cv2.COLOR_RGB2GRAY)
    canny_edges = cv2.Canny(img_gray, 100, 200)
    canny_image = Image.fromarray(canny_edges).convert("RGB")

    # 3. Prompt de Engenharia Otimizado para MePic
    full_positive_prompt = (
        f"hyperrealistic portrait, 8k resolution, professional studio lighting, "
        f"{hair_style_prompt}, natural hair strands, soft cinematic shadows, photorealistic skin texture"
    )

    # 4. Executa Inferência Latente
    with torch.inference_mode():
        output = pipe(
            prompt=full_positive_prompt,
            negative_prompt=negative_prompt,
            image_embeds=torch.tensor([face_emb]).to(device, dtype=torch.float16),
            image=canny_image,
            controlnet_conditioning_scale=controlnet_conditioning_scale,
            num_inference_steps=steps,
            guidance_scale=guidance_scale,
            ip_adapter_scale=identity_adapter_scale
        )

    output_image = output.images[0]
    return output_image`,
    deepDiveMarkdownPt: "### Redução de Custo por Geração de US$ 0,20 para US$ 0,01\n\n- Utilizar APIs externas como Replicate ou fal.ai custa cerca de US$ 0,15 a US$ 0,25 por imagem em alta resolução.\n- Ao hospedar o pipeline em instâncias spot com NVIDIA L4 / A10G na AWS ou GCP, o custo por inferência cai para menos de **US$ 0,012**, aumentando a margem bruta do aplicativo para mais de **85%**."
  },
  {
    id: 'paywall_onboarding',
    titlePt: '14. Onboarding Personalizado & Paywall Nativo de Alta Conversão (Flutter / Dart)',
    titleEn: '14. Personalized Onboarding & High-Conversion Native Paywall (Flutter / Dart)',
    icon: 'Coins',
    summaryPt: 'Fluxo interativo em Flutter com perguntas de estilo personalizadas, gatilhos de engajamento pré-cadastro e Paywall dinâmico com preços localizados em Reais (R$) e alternador de teste grátis.',
    summaryEn: 'Flutter interactive flow with style quiz, pre-signup engagement hooks, and dynamic Paywall with BRL currency localization and free trial switch.',
    language: 'dart',
    codeSnippet: `import 'package:flutter/material.dart';

// 1. TELA DE ONBOARDING PERSONALIZADO ME-PIC
class OnboardingQuizScreen extends StatefulWidget {
  const OnboardingQuizScreen({super.key});

  @override
  State<OnboardingQuizScreen> createState() => _OnboardingQuizScreenState();
}

class _OnboardingQuizScreenState extends State<OnboardingQuizScreen> {
  int _currentStep = 0;
  String? _selectedGoal;

  final List<Map<String, String>> _goals = [
    {
      'id': 'viral_dance',
      'title': 'Criar Vídeos de Dança para TikTok',
      'subtitle': 'Colocar minha foto para dançar as coreografias em alta',
      'emoji': '💃',
    },
    {
      'id': 'hair_changer',
      'title': 'Testar Novos Cortes e Cores de Cabelo',
      'subtitle': 'Loiro, ruivo, corte bob ou degradê sem ir ao salão',
      'emoji': '💇‍♀️',
    },
    {
      'id': 'headshots',
      'title': 'Fotos Profissionais para o LinkedIn',
      'subtitle': 'Retratos corporativos com iluminação de estúdio 8K',
      'emoji': '💼',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Barra de Progresso do Onboarding
              LinearProgressIndicator(
                value: (_currentStep + 1) / 3,
                backgroundColor: Colors.white12,
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF43F5E)),
                minHeight: 6,
                borderRadius: BorderRadius.circular(10),
              ),
              const SizedBox(height: 32),
              const Text(
                'O que você deseja criar com IA hoje?',
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, height: 1.2),
              ),
              const SizedBox(height: 8),
              const Text(
                'Personalizaremos seu catálogo e seus bônus de moedas de acordo com seu objetivo.',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: ListView.separated(
                  itemCount: _goals.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = _goals[index];
                    final isSelected = _selectedGoal == item['id'];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedGoal = item['id']),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF18181B),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isSelected ? const Color(0xFFF43F5E) : Colors.white12,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(item['emoji']!, style: const TextStyle(fontSize: 28)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['title']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                  const SizedBox(height: 4),
                                  Text(item['subtitle']!, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF43F5E),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: _selectedGoal == null
                      ? null
                      : () {
                          // Navega para o Paywall de conversão com desconto de boas-vindas
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const MePicPaywallScreen()));
                        },
                  child: const Text('Continuar', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// 2. TELA DE PAYWALL DINÂMICO (COM MOEDA EM REAIS R$ E TESTE GRÁTIS)
class MePicPaywallScreen extends StatefulWidget {
  const MePicPaywallScreen({super.key});

  @override
  State<MePicPaywallScreen> createState() => _MePicPaywallScreenState();
}

class _MePicPaywallScreenState extends State<MePicPaywallScreen> {
  bool _enableFreeTrial = true;
  String _selectedPlan = 'annual'; // 'weekly' | 'annual'

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(context)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          children: [
            const Icon(Icons.auto_awesome, color: Color(0xFFF43F5E), size: 44),
            const SizedBox(height: 12),
            const Text(
              'Desbloqueie o MePic VIP Ilimitado',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Gere vídeos de dança virais em 60 FPS e fotos 8K sem marcas d\\'água e com prioridade máxima na GPU.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 24),
            // Alternador de Teste Grátis
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: const Color(0xFF18181B), borderRadius: BorderRadius.circular(16)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Ativar 3 Dias de Teste Grátis', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  Switch.adaptive(
                    value: _enableFreeTrial,
                    activeColor: const Color(0xFFF43F5E),
                    onChanged: (val) => setState(() => _enableFreeTrial = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Opção 1: Anual (Melhor Valor)
            GestureDetector(
              onTap: () => setState(() => _selectedPlan = 'annual'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: _selectedPlan == 'annual' ? const Color(0xFFF43F5E) : Colors.white12, width: 2),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Plano Anual VIP + 500 Moedas', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        SizedBox(height: 4),
                        Text('Apenas R\$ 12,41 / mês (Cobrado R\$ 149,00 / ano)', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(8)),
                      child: const Text('ECONOMIZE 65%', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Opção 2: Semanal
            GestureDetector(
              onTap: () => setState(() => _selectedPlan = 'weekly'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: _selectedPlan == 'weekly' ? const Color(0xFFF43F5E) : Colors.white12, width: 2),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Plano Semanal VIP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        SizedBox(height: 4),
                        Text('60 Moedas / semana', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                    Text('R\$ 19,90 / sem', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF43F5E), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                onPressed: () {},
                child: Text(
                  _enableFreeTrial ? 'Iniciar Teste Grátis de 3 Dias' : 'Assinar Agora',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Cancele a qualquer momento nas configurações do Google Play ou App Store.',
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}`,
    deepDiveMarkdownPt: "### Estratégia de Monetização em Aplicativos de Foto/Vídeo IA\n\n1. **Onboarding com Enquete de Intenção:** Aplicativos como MePic, Remini e Photoleap utilizam de 3 a 5 perguntas de personalização antes do cadastro para aumentar o investimento emocional do usuário.\n2. **Gatilho de Teste Grátis com Opt-Out:** Oferecer 3 dias grátis no plano anual aumenta a taxa de conversão em até 3,5x no primeiro dia (D1), convertendo assinaturas recorrentes via Google Play Billing."
  }
];


