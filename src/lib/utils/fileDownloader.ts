import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toast } from "sonner";

/**
 * Downloads a file on both web and mobile platforms.
 * @param fileName The name of the file to save (e.g., "report.csv")
 * @param data The file content. For CSV/Text, pass the string. For PDF/Binary, pass base64 string.
 * @param mimeType The MIME type of the file (e.g., "text/csv", "application/pdf")
 * @param isBase64 Set to true if `data` is already a base64 string (required for binary files like PDF)
 */
export const downloadFile = async (
    fileName: string,
    data: string,
    mimeType: string,
    isBase64: boolean = false
) => {
    try {
        if (Capacitor.isNativePlatform()) {
            try {
                // Try saving directly to the public Download folder
                await Filesystem.writeFile({
                    path: `Download/${fileName}`,
                    data: data,
                    directory: Directory.ExternalStorage,
                    encoding: isBase64 ? undefined : Encoding.UTF8,
                    recursive: true
                });
                toast.success("Saved to Downloads folder");
            } catch (e) {
                console.error("Direct download failed, falling back to share:", e);
                // Fallback: Write to Cache and Share
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: data,
                    directory: Directory.Cache,
                    encoding: isBase64 ? undefined : Encoding.UTF8,
                });

                await Share.share({
                    title: `Share ${fileName}`,
                    text: `Here is your file: ${fileName}`,
                    url: savedFile.uri,
                    dialogTitle: `Save or Share ${fileName}`,
                });

                toast.info("Could not save directly. Please use 'Save to Files' option.");
            }
        } else {
            // Web: Use <a> tag download
            let url: string;
            if (isBase64) {
                // Convert base64 to Blob
                const byteCharacters = atob(data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                url = URL.createObjectURL(blob);
            } else {
                // Text/CSV
                const blob = new Blob([data], { type: `${mimeType};charset=utf-8;` });
                url = URL.createObjectURL(blob);
            }

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success("File downloaded successfully");
        }
    } catch (error) {
        console.error("Download failed:", error);
        toast.error("Failed to download file");
    }
};
