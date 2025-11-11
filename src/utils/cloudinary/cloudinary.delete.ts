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



export async function deleteFolderFromCloudinary(folderPath : string) {

  try {
    // Step 1: Delete all files under this folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);

    // Step 2: List and delete subfolders recursively
    const { folders } = await cloudinary.api.sub_folders(folderPath);
    for (const sub of folders) {
      await deleteFolderFromCloudinary(sub.path);
    }

    // Step 3: Check if folder is empty now
    const remaining = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 1,
    });

    if (remaining.resources.length === 0) {
      // Step 4: Delete the folder itself
      await cloudinary.api.delete_folder(folderPath);
    }
  } catch (error : any) {


    if (error.error.http_code === 404) {
      console.warn(`⚠️ Folder not found: ${folderPath}`);
      return; // تجاهل بس ما ترميش
    }


    throw new ApplicationException(
      `Error deleting folder "${folderPath}": ${error.message || error}`
    );

  }
}