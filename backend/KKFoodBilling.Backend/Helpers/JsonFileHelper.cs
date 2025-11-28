using System.Text.Json;

namespace KKFoodBilling.Backend.Helpers;

public static class JsonFileHelper
{
    private static readonly string DataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data");

    static JsonFileHelper()
    {
        if (!Directory.Exists(DataPath))
        {
            Directory.CreateDirectory(DataPath);
        }
    }

    public static List<T> GetData<T>(string fileName)
    {
        var filePath = Path.Combine(DataPath, fileName);
        if (!File.Exists(filePath))
        {
            return new List<T>();
        }

        var json = File.ReadAllText(filePath);
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<T>();
        }

        try 
        {
            return JsonSerializer.Deserialize<List<T>>(json) ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }

    public static void SaveData<T>(string fileName, List<T> data)
    {
        var filePath = Path.Combine(DataPath, fileName);
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(filePath, json);
    }
}
