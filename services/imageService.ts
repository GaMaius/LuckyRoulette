
/**
 * 이미지를 압축하고 리사이징하여 Base64 문자열로 반환합니다.
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 가로/세로 길이
 * @param quality 압축 품질 (0~1)
 */
export const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 리사이징 로직
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context is null');

        ctx.drawImage(img, 0, 0, width, height);
        // JPEG 포맷으로 압축하여 용량 축소
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
