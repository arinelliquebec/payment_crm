using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CrmArrighi.Services
{
    public interface IAzureBlobStorageService
    {
        Task<string> UploadFileAsync(string fileName, byte[] fileContent, string contentType);
        Task<string> UploadFileAsync(string containerName, string blobName, Stream content, string contentType);
        Task<string> UploadBase64FileAsync(string fileName, string base64Content);
        Task<byte[]> DownloadFileAsync(string fileName);
        Task<bool> DeleteFileAsync(string fileName);
        Task<bool> FileExistsAsync(string fileName);
        string GetFileUrl(string fileName);
        Task<List<string>> ListBlobsAsync(string containerName, string prefix);
    }

    public class AzureBlobStorageService : IAzureBlobStorageService
    {
        private readonly BlobServiceClient? _blobServiceClient;
        private readonly string _containerName;
        private readonly bool _isConfigured;

        public AzureBlobStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureStorage:ConnectionString"];
            _containerName = configuration["AzureStorage:ContainerName"] ?? "contratos";

            if (string.IsNullOrEmpty(connectionString))
            {
                Console.WriteLine("⚠️ AzureBlobStorageService: AzureStorage:ConnectionString não configurada. Operações de blob storage não estarão disponíveis.");
                _isConfigured = false;
                return;
            }

            _blobServiceClient = new BlobServiceClient(connectionString);
            _isConfigured = true;

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            containerClient.CreateIfNotExists(PublicAccessType.None);

            Console.WriteLine($"✅ AzureBlobStorageService: Inicializado com container '{_containerName}'");
        }

        private void EnsureConfigured()
        {
            if (!_isConfigured || _blobServiceClient == null)
                throw new InvalidOperationException("Azure Blob Storage não está configurado. Adicione 'AzureStorage:ConnectionString' no appsettings.json.");
        }

        public async Task<string> UploadFileAsync(string fileName, byte[] fileContent, string contentType)
        {
            EnsureConfigured();
            try
            {
                Console.WriteLine($"📤 UploadFileAsync: Iniciando upload de '{fileName}' ({fileContent.Length} bytes)");

                var containerClient = _blobServiceClient!.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                using var stream = new MemoryStream(fileContent);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions);

                Console.WriteLine($"✅ UploadFileAsync: Arquivo '{fileName}' enviado com sucesso!");
                Console.WriteLine($"   URL: {blobClient.Uri}");

                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UploadFileAsync: Erro ao enviar arquivo '{fileName}': {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadBase64FileAsync(string fileName, string base64Content)
        {
            try
            {
                Console.WriteLine($"📤 UploadBase64FileAsync: Convertendo base64 para arquivo '{fileName}'");

                var base64String = base64Content;
                if (base64String.Contains(","))
                {
                    base64String = base64String.Substring(base64String.IndexOf(",") + 1);
                }

                base64String = System.Text.RegularExpressions.Regex.Replace(base64String, @"[^A-Za-z0-9+/=]", "");

                var fileBytes = Convert.FromBase64String(base64String);
                Console.WriteLine($"   Base64 convertido: {fileBytes.Length} bytes");

                var contentType = fileName.ToLower().EndsWith(".pdf") ? "application/pdf" : "application/octet-stream";

                return await UploadFileAsync(fileName, fileBytes, contentType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UploadBase64FileAsync: Erro ao processar base64 para '{fileName}': {ex.Message}");
                throw;
            }
        }

        public async Task<byte[]> DownloadFileAsync(string fileName)
        {
            EnsureConfigured();
            try
            {
                Console.WriteLine($"📥 DownloadFileAsync: Baixando arquivo '{fileName}'");

                var containerClient = _blobServiceClient!.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                if (!await blobClient.ExistsAsync())
                {
                    Console.WriteLine($"❌ DownloadFileAsync: Arquivo '{fileName}' não encontrado");
                    throw new FileNotFoundException($"Arquivo '{fileName}' não encontrado no Azure Blob Storage");
                }

                using var memoryStream = new MemoryStream();
                await blobClient.DownloadToAsync(memoryStream);

                Console.WriteLine($"✅ DownloadFileAsync: Arquivo '{fileName}' baixado com sucesso ({memoryStream.Length} bytes)");

                return memoryStream.ToArray();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DownloadFileAsync: Erro ao baixar arquivo '{fileName}': {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            EnsureConfigured();
            try
            {
                Console.WriteLine($"🗑️ DeleteFileAsync: Deletando arquivo '{fileName}'");

                var containerClient = _blobServiceClient!.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                var result = await blobClient.DeleteIfExistsAsync();

                if (result.Value)
                {
                    Console.WriteLine($"✅ DeleteFileAsync: Arquivo '{fileName}' deletado com sucesso");
                }
                else
                {
                    Console.WriteLine($"⚠️ DeleteFileAsync: Arquivo '{fileName}' não existia");
                }

                return result.Value;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DeleteFileAsync: Erro ao deletar arquivo '{fileName}': {ex.Message}");
                throw;
            }
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            EnsureConfigured();
            try
            {
                var containerClient = _blobServiceClient!.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                return await blobClient.ExistsAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ FileExistsAsync: Erro ao verificar arquivo '{fileName}': {ex.Message}");
                return false;
            }
        }

        public string GetFileUrl(string fileName)
        {
            EnsureConfigured();
            var containerClient = _blobServiceClient!.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            return blobClient.Uri.ToString();
        }

        public async Task<string> UploadFileAsync(string containerName, string blobName, Stream content, string contentType)
        {
            EnsureConfigured();
            try
            {
                Console.WriteLine($"📤 UploadFileAsync: Iniciando upload de '{blobName}' no container '{containerName}'");

                var containerClient = _blobServiceClient!.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
                var blobClient = containerClient.GetBlobClient(blobName);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType
                    }
                };

                await blobClient.UploadAsync(content, uploadOptions);

                Console.WriteLine($"✅ UploadFileAsync: Arquivo '{blobName}' enviado com sucesso!");
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UploadFileAsync: Erro ao enviar arquivo '{blobName}': {ex.Message}");
                throw;
            }
        }

        public async Task<List<string>> ListBlobsAsync(string containerName, string prefix)
        {
            EnsureConfigured();
            try
            {
                Console.WriteLine($"📋 ListBlobsAsync: Listando blobs no container '{containerName}' com prefixo '{prefix}'");

                var containerClient = _blobServiceClient!.GetBlobContainerClient(containerName);
                var blobs = new List<string>();

                await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: prefix))
                {
                    blobs.Add(blobItem.Name);
                }

                Console.WriteLine($"✅ ListBlobsAsync: {blobs.Count} blobs encontrados");
                return blobs;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ListBlobsAsync: Erro ao listar blobs: {ex.Message}");
                throw;
            }
        }
    }
}
