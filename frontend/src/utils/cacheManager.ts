/**
 * Utilitário para gerenciar e limpar todos os caches da aplicação
 */
export class CacheManager {
  static clearAllCaches() {
    if (typeof window === "undefined") return;

    // Lista de todas as chaves de cache conhecidas
    const cacheKeys = [
      "crm_permissions_cache",
      "crm_navigation_cache",
      "crm_grupo_acesso_cache",
      "user",
      "token",
      "isAuthenticated",
    ];

    // Limpar localStorage
    cacheKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Limpar sessionStorage também
    sessionStorage.clear();

    console.log("🧹 Todos os caches foram limpos");
  }

  static clearUserCaches() {
    if (typeof window === "undefined") return;

    const userCacheKeys = ["crm_permissions_cache", "user"];

    userCacheKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("🧹 Caches do usuário foram limpos");
  }

  static logAllCaches() {
    if (typeof window === "undefined") return;

    console.log("🔍 DEBUG - Estado atual dos caches:");
    console.log("localStorage.user:", localStorage.getItem("user"));
    console.log(
      "localStorage.isAuthenticated:",
      localStorage.getItem("isAuthenticated")
    );
    console.log(
      "localStorage.crm_permissions_cache:",
      localStorage.getItem("crm_permissions_cache")
    );
  }
}
