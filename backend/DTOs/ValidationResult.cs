namespace CrmArrighi.DTOs
{
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public Dictionary<string, List<string>> FieldErrors { get; set; } = new Dictionary<string, List<string>>();

        public void AddError(string error)
        {
            Errors.Add(error);
        }

        public void AddFieldError(string field, string error)
        {
            if (!FieldErrors.ContainsKey(field))
                FieldErrors[field] = new List<string>();

            FieldErrors[field].Add(error);
        }

        public static ValidationResult Success()
        {
            return new ValidationResult { IsValid = true };
        }

        public static ValidationResult Failure(params string[] errors)
        {
            return new ValidationResult
            {
                IsValid = false,
                Errors = errors.ToList()
            };
        }
    }
}
