// Debug das variáveis de ambiente
export const debugEnvironment = () => {
  console.log("🔍 Debug das Variáveis de Ambiente:");
  console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
  console.log("NEXT_PUBLIC_ENVIRONMENT:", process.env.NEXT_PUBLIC_ENVIRONMENT);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("process.env:", process.env);

  // Testar a função getApiUrl
  const { getApiUrl } = require("../../env.config");
  console.log("getApiUrl():", getApiUrl());
};

// Função para testar a URL da API
export const testApiUrl = async () => {
  const { getApiUrl } = require("../../env.config");
  const apiUrl = getApiUrl();

  console.log("🧪 Testando URL da API:", apiUrl);

  try {
    const response = await fetch(`${apiUrl}/PessoaFisica`);
    console.log("✅ API respondendo:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Dados recebidos:", data.length, "registros");
    } else {
      const errorText = await response.text();
      console.error("❌ Erro na resposta:", errorText);
    }
  } catch (error) {
    console.error("❌ Erro ao conectar com API:", error);
  }
};

// Função para testar todas as APIs do dashboard
export const testDashboardApis = async () => {
  const { getApiUrl } = require("../../env.config");
  const apiUrl = getApiUrl();

  console.log("🧪 Testando APIs do Dashboard:", apiUrl);

  const endpoints = ["/PessoaFisica", "/PessoaJuridica", "/Usuario"];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando ${endpoint}...`);
      const response = await fetch(`${apiUrl}${endpoint}`);

      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get("content-type")}`);

      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ ${endpoint}: ${
            Array.isArray(data) ? data.length : "OK"
          } registros`
        );
      } else {
        const errorText = await response.text();
        console.error(`❌ ${endpoint}: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint}: ${error}`);
    }
  }
};
