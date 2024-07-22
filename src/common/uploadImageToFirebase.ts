import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";

export const uploadImageToFirebase = async (
  imageUri: string,
  storagePath: string,
): Promise<string> => {
  const fetchResponse = await fetch(imageUri);
  const blob = await fetchResponse.blob();

  const imageRef = ref(getStorage(), storagePath);
  const uploadTask = await uploadBytesResumable(imageRef, blob);

  const downloadUrl = await getDownloadURL(uploadTask.ref);
  return downloadUrl;
};
