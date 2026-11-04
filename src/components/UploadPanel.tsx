import { useRef } from 'react';
import type { SourceImage } from '../domain/model.ts';
import type { SessionState } from '../domain/session.ts';

type Props = { source: SourceImage | null; session: SessionState; technicalError: string | null; onFile(file: File): void };

export function UploadPanel({ source, session, technicalError, onFile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const reading = session.phase === 'reading';
  return <section className="upload-panel" aria-labelledby="upload-heading" aria-busy={reading}>
    <div className="upload-intro">
      {source ? <img className="source-thumb" src={source.url} alt="" width="48" height="60" /> : null}
      <div className="source-summary">
        <h2 id="upload-heading">Foto daftar harga</h2>
        {session.fileName ? <p className="file-name">{session.fileName}</p> : <p>Mulai dengan mengunggah foto dari galeri atau penyimpanan perangkat.</p>}
        {source ? <p className="file-dimensions">{source.width} × {source.height} piksel</p> : null}
      </div>
      <input ref={input} id="upload-file" name="photo" type="file" accept="image/jpeg,image/png,image/webp" hidden
        onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) onFile(file); }} />
      <button className="primary upload-button" type="button" onClick={() => input.current?.click()}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5" /></svg>
        {session.fileName ? 'Unggah foto lain' : 'Unggah foto'}
      </button>
    </div>
    <p className="upload-hint">JPEG, PNG, atau WebP. Gunakan foto utuh Redmark/Gift Series dengan rasio 4:5, tanpa crop atau rotasi.</p>
    <p className="privacy-note">Foto diproses di browser dan tidak dikirim ke server. Foto baru akan mereset pengaturan kenaikan.</p>
    {reading ? <div className="reading-state" role="status">
      <div className="reading-caption"><strong>Membaca harga dan tanggal…</strong><span>{Math.round(session.progress * 100)}%</span></div>
      <progress aria-label="Progres pembacaan foto" max="1" value={session.progress} />
    </div> : null}
    {session.error ? <div className="notice error-notice" role="alert"><p>{session.error}</p>
      {technicalError ? <details><summary>Detail teknis</summary><p>{technicalError}</p></details> : null}
    </div> : null}
  </section>;
}
