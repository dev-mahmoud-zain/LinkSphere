import { ApplicationException, BadRequestException } from "../response/error.response";
import cloudinary from "./cloudinary.config";

export const deleteImageFromCloudinary = async (publicId: string): Promise<void | true> => {
  try {
    await cloudinary.uploader.destroy(publicId);

      return true

  } catch (error) {
    console.error(`❌ Error deleting image: ${publicId}`, error);
    throw error;
  }

};


export async function deleteMultiFromCloudinary(
  publicIds: string[]
): Promise<boolean> {
  try {
    if (!publicIds.length) return false;

    const results = await Promise.all(
      publicIds.map(async (publicId) => {


        try {
          const result = await cloudinary.uploader.destroy(publicId);

          if (result.result === 'not found') {
            throw new BadRequestException(`Image not found`);
          }

          return true;

        } catch (error : any) {
          console.error(`❌ Failed to delete ${publicId}:`, error.message);
          throw error
        }
      })
    );

    const allDeleted = results.every((r) => r === true);

    return allDeleted;

  } catch (error) {
    console.error('Error deleting multiple files from Cloudinary:', error);
    throw new ApplicationException('Error deleting multiple files from Cloudinary');
  }
}



export async function deleteFolderFromCloudinary(folderPath: string) {
  try {
    // Step 1: Delete all resources under this folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);

    // Step 2: Get subfolders
    const { folders } = await cloudinary.api.sub_folders(folderPath);

    // Step 3: Delete subfolders recursively
    for (const sub of folders) {
      await deleteFolderFromCloudinary(sub.path);
    }

    // Step 4: Try to delete the folder itself (even if no resources)
    await cloudinary.api.delete_folder(folderPath).catch(() => {
      // ignore if doesn't exist
    });

  } catch (error: any) {
    if (error?.error?.http_code === 404) {
      console.warn(`⚠️ Folder not found: ${folderPath}`);
      return;
    }

    throw new ApplicationException(
      `Error deleting folder "${folderPath}": ${error.message || error}`
    );
  }
}