function formatContentfulFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith("//")) {
    return `https:${fileUrl}`;
  }

  return fileUrl;
}

export const contentful_utils = {
  formatContentfulFileUrl,
};
