# Guia de Preparação e Execução Nativa — Android e iOS

Este documento detalha a arquitetura, as configurações locais e os procedimentos para compilar e executar a candidata integrada do **ATHENA** no **Android** e no **iOS**.

---

## 1. Identidade e Configurações Essenciais

- **Identificador Único (Bundle ID / Package Name)**: `com.athena.mentoria`
- **Nome de Exibição**: `ATHENA - Mentoria Jurídica`
- **Projeto Firebase**: `gen-lang-client-0822763072` (Auth Domain: `athena-mentoria.firebaseapp.com`)
- **Configuração do Capacitor (`capacitor.config.ts`)**:
  ```ts
  import type { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'com.athena.mentoria',
    appName: 'ATHENA - Mentoria Jurídica',
    webDir: 'dist',
    server: {
      androidScheme: 'https'
    },
    android: {
      allowMixedContent: true
    },
    plugins: {
      FirebaseAuthentication: {
        skipNativeAuth: true,
        providers: ['google.com'],
        authDomain: 'gen-lang-client-0822763072.firebaseapp.com'
      }
    }
  };

  export default config;
  ```

> [!WARNING]
> **Limite do `cap sync` (Não Constitui Homologação)**:
> Executar `npx cap sync` realiza unicamente a cópia física dos assets web compilados (`dist/`) e a vinculação de plugins nos projetos `android/` e `ios/`.
> **`cap sync` NÃO significa que o login nativo com Google ou o faturamento in-app estejam homologados**. A homologação nativa exige registro dos fingerprints SHA-1/SHA-256 no console do Firebase/Google Cloud, configuração do cliente OAuth Android/iOS, provisionamento de perfis Apple no Xcode e testes em dispositivos físicos ou emuladores nativos.

---

## 2. Mecanismo de Autenticação e Comunicação com a API

### A. Diferenciação Web vs. Nativo
- **Na Web**: O login com Google utiliza `signInWithPopup(auth, provider, browserPopupRedirectResolver)`.
- **No Android e iOS**: O navegador da WebView bloqueia pop-ups OAuth tradicionais. Por isso, a autenticação utiliza a ponte nativa `@capacitor-firebase/authentication`:
  1. O plugin nativo abre a interface de seleção de contas da Google Play Services (Android) ou ASWebAuthenticationSession (iOS).
  2. O plugin devolve as credenciais seguras (`idToken` e `accessToken`).
  3. O cliente ATHENA gera a credencial Firebase: `GoogleAuthProvider.credential(idToken, accessToken)`.
  4. Autentica no SDK JS do Firebase via `signInWithCredential(auth, credential)`.
  5. Sincroniza a sessão com o backend chamando `/api/auth/session` via `confirmServerSession(user)`.

### B. Restauração Automática da Sessão
- Na inicialização do app nativo, o Firebase Auth restaura os tokens persistidos em disco de forma assíncrona (`onAuthStateChanged`).
- A aplicação escuta a restauração e invoca `loadAuthorizedStudentSessions()` e `refreshStudyAccess()`.

### C. Comunicação com a API Protegida (`getApiUrl`)
- Na Web local: Chamadas relativas direcionam para o proxy Express (`/api/*`).
- No Aplicativo Nativo: `getApiUrl(endpoint)` detecta a plataforma nativa (`isNativeMobile()`) e roteia as requisições para a Cloud Function oficial:
  ```
  https://southamerica-east1-gen-lang-client-0822763072.cloudfunctions.net/athenaApi
  ```
  Isso garante que o aplicativo móvel acesse o backend seguro sem expor chaves de API locais.

---

## 3. Preparação e Execução do Android (Executável neste ambiente)

### Arquivos Presentes e Verificados
- `android/app/google-services.json`: Configurado para o pacote `com.athena.mentoria`.
- `android/app/build.gradle`: Configurado com `minSdkVersion 24`, `targetSdkVersion 34`, `compileSdkVersion 34`, `versionCode 14`, `versionName "1.3.9"`.
- `android/app/src/main/AndroidManifest.xml`: Permissões de Internet e Áudio (`RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`).

### Comandos de Sincronização e Compilação
```bash
# 1. Gerar o build da aplicação web
npm run build

# 2. Sincronizar o projeto Android nativo
npx cap sync android

# 3. Abrir o projeto no Android Studio
npx cap open android

# 4. Ou compilar diretamente via Gradle (se o Android SDK estiver configurado)
cd android
./gradlew assembleDebug
# APK gerado em: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Preparação do Projeto iOS

### Arquivos e Estrutura Gerados Localmente
- O projeto nativo iOS foi adicionado via Capacitor (`ios/`) e sincronizado com os assets web.
- O arquivo `ios/App/App/Info.plist` foi devidamente configurado com:
  - `CFBundleDisplayName`: `ATHENA - Mentoria Jurídica`
  - `CFBundleIdentifier`: `com.athena.mentoria`
  - Descrições de Privacidade obrigatórias para a App Store:
    - `NSMicrophoneUsageDescription`: Permissão para respostas orais nos exercícios jurídicos.
    - `NSSpeechRecognitionUsageDescription`: Transcrição de voz durante os treinos.
- Dependência `@capacitor/ios@8.5.2` adicionada ao `package.json`.

### Comandos Locais de Sincronização
```bash
# Atualizar assets web e plugins no projeto iOS
npm run build
npx cap sync ios
```

---

## 5. Etapas que Exigem macOS, Certificados e Intervenção Humana

As seguintes etapas são restritas ao ambiente macOS devido a requisitos da Apple:

1. **Arquivo `GoogleService-Info.plist`**:
   - Baixar o arquivo `GoogleService-Info.plist` no Console do Firebase (para o bundle `com.athena.mentoria`).
   - Copiar o arquivo para o diretório `ios/App/App/GoogleService-Info.plist`.
   - Adicionar o arquivo ao target `App` dentro do Xcode.

2. **Esquema de URL do Google Sign-In**:
   - No `GoogleService-Info.plist`, localizar a chave `REVERSED_CLIENT_ID` (ex.: `com.googleusercontent.apps.12345-abcde`).
   - No Xcode, acessar a aba **Info** do target `App` -> **URL Types** -> adicionar uma nova URL Type com o identificador e o esquema preenchidos com o `REVERSED_CLIENT_ID`.

3. **Instalação de Dependências de Pods / SPM (no macOS)**:
   ```bash
   cd ios/App
   pod install # se aplicável ou compilar via Xcode SPM
   ```

4. **Assinatura de Código e Provisionamento (Xcode)**:
   - Abrir o projeto no Xcode no macOS: `npx cap open ios`.
   - Na aba **Signing & Capabilities**, selecionar a equipe de desenvolvimento (*Apple Developer Team*).
   - Configurar o Certificado de Distribuição e o perfil de provisionamento para `com.athena.mentoria`.

5. **Geração do Arquivo para TestFlight**:
   - No menu do Xcode: **Product** -> **Archive**.
   - Validar e enviar o build para o App Store Connect via Organizer.
