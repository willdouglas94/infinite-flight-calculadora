# IF Ultimate Calc

**Infinite Flight Ultimate Calculator** - Calculadora avançada de velocidades de decolagem e pouso para o simulador Infinite Flight.

## 🚀 Funcionalidades

- ✈️ **Banco de dados completo** com 50+ aeronaves (Airbus, Boeing, Embraer, CRJ, caças militares, aviação geral)
- 🌦️ **Integração METAR automática** - busca clima em tempo real
- 🛬 **Análise inteligente de pistas** - recomenda a melhor pista baseada no vento
- 📊 **Cálculos precisos** de V1, VR, V2 (decolagem) e VREF, VAPP (pouso)
- ⚙️ **Configuração de flaps** específica para cada aeronave
- 📱 **Interface responsiva** - funciona em desktop e mobile

## 🛠️ Tecnologias

- React + TypeScript + Vite
- Tailwind CSS
- Shadcn UI
- Lucide React (ícones)

## 📦 Deploy na Vercel (Passo a Passo)

### Passo 1: Criar Repositório no GitHub via Lovable

1. No editor Lovable, clique no botão **"GitHub"** (ícone do Git) no canto superior direito
2. Se ainda não conectou sua conta GitHub, clique em **"Connect to GitHub"** e autorize
3. Clique em **"Create Repository"**
4. Dê um nome ao repositório (ex: `if-ultimate-calc`)
5. Aguarde alguns segundos - o Lovable criará automaticamente o repositório no seu GitHub com todo o código

### Passo 2: Deploy na Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **"Sign Up"** ou **"Log In"**
3. Faça login com sua conta GitHub (recomendado) ou outro método
4. No dashboard da Vercel, clique no botão **"Add New..."** → **"Project"**
5. Na lista de repositórios, encontre o repositório que você criou (ex: `if-ultimate-calc`)
   - Se não aparecer, clique em **"Adjust GitHub App Permissions"** para autorizar
6. Clique em **"Import"** ao lado do seu repositório
7. Na tela de configuração:
   - **Framework Preset**: Vercel detectará automaticamente como "Vite"
   - **Root Directory**: deixe como `./` (raiz)
   - **Build Command**: `npm run build` (já preenchido)
   - **Output Directory**: `dist` (já preenchido)
8. Clique em **"Deploy"**
9. Aguarde 1-2 minutos enquanto a Vercel faz o build e deploy
10. 🎉 Pronto! Seu app estará no ar em uma URL como `https://if-ultimate-calc.vercel.app`

### Atualizações Futuras

Após o primeiro deploy, qualquer mudança que você fizer no Lovable será automaticamente sincronizada com o GitHub, e a Vercel fará o redeploy automático. Você não precisa fazer nada manualmente!

## 🧮 Lógica de Cálculo

### Decolagem (Takeoff)
- **VR (Rotation Speed)**: `BaseVR + (MaxVR - BaseVR) × WeightRatio × FlapFactor`
- **V1 (Decision Speed)**: `VR - 5 knots`
- **V2 (Takeoff Safety Speed)**: `VR + 10 knots`

### Pouso (Landing)
- **VREF (Reference Speed)**: `BaseRef + (MaxRef - BaseRef) × WeightRatio × FlapFactor`
- **VAPP (Approach Speed)**: `VREF + WindCorrection` (correção de vento limitada entre 5-20 kt)

**WeightRatio** = `(PesoAtual - PesoVazio) / (PesoMax - PesoVazio)`

## 📄 Licença

Projeto open-source criado para a comunidade Infinite Flight.

---

Desenvolvido com ❤️ para pilotos virtuais
