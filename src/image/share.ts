export function canShareImageFiles(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): boolean {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    const dummy = new File([new Uint8Array([0])], 'probe.png', { type: 'image/png' });
    return nav.canShare({ files: [dummy] });
  } catch {
    return false;
  }
}

export async function shareImageFile(file: File, nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): Promise<boolean> {
  if (!nav || typeof nav.share !== 'function') {
    throw new Error('Fitur berbagi tidak didukung pada browser ini.');
  }
  try {
    await nav.share({
      files: [file],
      title: 'Daftar Harga Emas',
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }
    throw new Error('Gagal membagikan gambar ke media sosial. Pastikan aplikasi tujuan terpasang dan izin berbagi aktif.');
  }
}
