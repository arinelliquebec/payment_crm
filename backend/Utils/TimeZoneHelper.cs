using System;

namespace CrmArrighi.Utils
{
    public static class TimeZoneHelper
    {
        private static readonly TimeZoneInfo _brasiliaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");

        /// <summary>
        /// Obtém a data/hora atual no timezone de Brasília
        /// </summary>
        public static DateTime GetBrasiliaTime()
        {
            return TimeZoneInfo.ConvertTime(DateTime.UtcNow, _brasiliaTimeZone);
        }

        /// <summary>
        /// Converte uma data UTC para o timezone de Brasília
        /// </summary>
        public static DateTime ConvertToBrasiliaTime(DateTime utcDateTime)
        {
            return TimeZoneInfo.ConvertTime(utcDateTime, TimeZoneInfo.Utc, _brasiliaTimeZone);
        }

        /// <summary>
        /// Converte uma data do timezone de Brasília para UTC
        /// </summary>
        public static DateTime ConvertToUtc(DateTime brasiliaDateTime)
        {
            return TimeZoneInfo.ConvertTime(brasiliaDateTime, _brasiliaTimeZone, TimeZoneInfo.Utc);
        }

        /// <summary>
        /// Obtém a data/hora atual em UTC (para salvar no banco)
        /// </summary>
        public static DateTime GetUtcTime()
        {
            return DateTime.UtcNow;
        }
    }
}
