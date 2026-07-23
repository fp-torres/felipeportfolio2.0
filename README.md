# Felipe Torres — Portfólio

Portfólio bilíngue e responsivo desenvolvido com React, Vite e Tailwind CSS. O projeto reúne trajetória profissional, projetos, certificações, stack, métricas reais de programação e uma arcade com seis minigames.

## Principais recursos

- Interface em português e inglês, com preferência salva no navegador.
- Perfil e atividade pública carregados pela API do GitHub.
- WakaTime com períodos de 7 dias, 30 dias e histórico completo.
- Cache em duas camadas para manter a última leitura real quando a API oscilar.
- Widget do Spotify com bridge PHP e fallback pelo Discord/Lanyard.
- NASA APOD, máquina do tempo e radar de notícias como easter eggs.
- Seis minigames responsivos com recordes locais.
- Carregamento sob demanda dos jogos e imagens WebP otimizadas.
- Navegação por teclado, foco visível, suporte a movimento reduzido e menus/modais acessíveis.
- Deploy automático na Hostinger por GitHub Actions.

## Stack

- React 19
- Vite 7
- Tailwind CSS
- Framer Motion
- PHP/cURL para as integrações privadas
- GitHub Actions + FTP

## WakaTime

O portfólio abre por padrão as estatísticas dos últimos 30 dias, o que representa melhor a atividade recente do que o histórico total. O endpoint aceita somente:

- `last_7_days`
- `last_30_days`
- `all_time`

O bridge PHP mantém um cache de 15 minutos no diretório temporário do servidor. Se o WakaTime responder com processamento pendente, limite de requisições ou indisponibilidade, o último resultado válido continua visível e é identificado como cache. O navegador também guarda a última leitura válida; números fictícios não são usados.

## Executando localmente

Requisitos:

- Node.js 22+
- npm
- PHP 7.4+ com extensão cURL

Instale as dependências:

```bash
npm ci
```

Crie a configuração local sem versionar credenciais:

```bash
cp public/config.example.php public/config.php
```

Preencha `public/config.php` ou exporte estas variáveis:

```text
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
WAKATIME_TOKEN
```

Inicie o PHP em um terminal:

```bash
npm run dev:api
```

Inicie o Vite em outro terminal:

```bash
npm run dev
```

O Vite encaminha `/spotify.php` e `/wakatime.php` para `127.0.0.1:8000`.

## Validação

```bash
npm run lint
npm run build
npm run preview
```

Também é possível validar os bridges:

```bash
php -l public/wakatime.php
php -l public/spotify.php
```

## Deploy

Um push na branch `main` executa:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. criação segura de `dist/config.php` a partir dos secrets
5. sincronização de `dist/` com a Hostinger

Secrets exigidos no repositório:

```text
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
WAKATIME_TOKEN
```

`public/config.php` está no `.gitignore` e não deve ser incluído em commits ou arquivos compartilhados. Se uma credencial for exposta, revogue-a e gere outra.

## Estrutura

```text
public/
  config.example.php
  spotify.php
  wakatime.php
src/
  components/
    games/
    layout/
    sections/
  context/
  data/
```

## Arcade

- Tech Memory
- Dev Snake
- Cyber Sequence
- Matrix Recall
- Decryptor
- Logic Quiz

Os recordes ficam somente no `localStorage` do visitante.
