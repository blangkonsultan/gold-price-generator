import { PRODUCTS, type AmountKind } from '../domain/model.ts';
import { formatRupiah } from '../domain/pricing.ts';
import { formatIndonesianDate } from '../image/dates.ts';
import type { EditorActions, EditorModel } from '../hooks/usePriceImage.ts';
import { AmountInput } from './AmountInput.tsx';

const GROUPS = ['Redmark', 'Gift Series'].map(category => ({ category, products: PRODUCTS.filter(product => product.category === category) }));

type Props = { model: EditorModel; actions: EditorActions };

export function PriceEditor({ model, actions }: Props) {
  const { session, derived, global, overrides, date, renderError } = model;
  const reading = session.phase === 'reading';
  let globalIssue = derived.globalIssue;
  if (!globalIssue) for (const product of PRODUCTS) {
    if (!overrides[product.id] && derived.rowIssues[product.id]) {
      globalIssue = `${product.category} ${product.weight}: ${derived.rowIssues[product.id]}`;
      break;
    }
  }
  if (!globalIssue && renderError && renderError.field !== 'date' && !overrides[renderError.field]) globalIssue = renderError.message;
  const dateIssue = derived.dateIssue ?? (renderError?.field === 'date' ? renderError.message : null);
  return <section className="editor-panel" id="editor-section" aria-labelledby="editor-heading">
    <header className="panel-heading"><h2 id="editor-heading" tabIndex={-1}>Atur harga</h2><span className="muted">Per produk, bukan per gram</span></header>
    <div className="settings-grid">
      <fieldset className="setting-block">
        <legend>Kenaikan semua harga</legend>
        <div className="global-fields">
          <div className="field"><label htmlFor="global-mode">Satuan</label><select id="global-mode" name="global-mode" autoComplete="off" value={global.kind} aria-label="Satuan kenaikan semua harga"
            onChange={event => actions.globalKind(event.currentTarget.value as AmountKind)}>
            <option value="rupiah">Rupiah (Rp)</option><option value="percent">Persen (%)</option>
          </select></div>
          <AmountInput id="global-value" label="Nilai kenaikan" ariaLabel="Nilai kenaikan semua harga" kind={global.kind} value={global.text}
            onChange={actions.globalText} error={globalIssue} required={PRODUCTS.some(product => !overrides[product.id])} />
        </div>
        <p className="setting-hint">{global.kind === 'rupiah' ? 'Isi rupiah utuh, misalnya 50.000. Nilai ini ditambahkan sekali ke setiap produk.' : 'Gunakan koma untuk desimal, misalnya 1,5. Hasil dibulatkan ke rupiah utuh.'}</p>
      </fieldset>
      <fieldset className="setting-block date-block">
        <legend>Tanggal hasil gambar</legend>
        <div className="field"><label htmlFor="image-date">Tanggal pilihan</label><input id="image-date" name="image-date" autoComplete="off" type="date" required={date.kind === 'replace'}
          value={date.kind === 'replace' ? date.iso : session.dateISO ?? ''} disabled={date.kind === 'keep'} min="0001-01-01" max="9999-12-31"
          aria-describedby={'date-hint' + (dateIssue ? ' date-error' : '')} aria-invalid={dateIssue ? true : undefined}
          onChange={event => actions.date(event.currentTarget.value)} />
          {dateIssue ? <p className="field-error" id="date-error" aria-live="polite">{dateIssue}</p> : null}
        </div>
        <button type="button" className="text-button" onClick={date.kind === 'keep' ? actions.replaceDate : actions.keepDate}>
          {date.kind === 'keep' ? 'Ganti tanggal' : 'Pakai tanggal foto'}
        </button>
        <p className="setting-hint" id="date-hint">{date.kind === 'keep'
          ? `Tanggal asli di foto tetap dipakai.${session.dateISO ? ' Terbaca: ' + formatIndonesianDate(session.dateISO) + '.' : ' Tanggal belum terbaca otomatis.'}`
          : 'Tanggal pilihan akan menggantikan tanggal pada foto.'}</p>
      </fieldset>
    </div>
    <div className="review-heading"><h3>Periksa harga awal</h3><span role="status" aria-live="polite" className={session.phase === 'ready' ? 'review-state confirmed' : 'review-state'}>
      {reading ? 'Sedang dibaca' : session.phase === 'ready' ? 'Sudah dikonfirmasi' : `${derived.knownCount} dari ${PRODUCTS.length} terisi`}
    </span></div>
    <p className="review-help" id="review-help">Semua harga awal wajib diisi dan sama dengan foto. Koreksi hasil baca yang keliru, lalu konfirmasi sebelum mengunduh. Aturan khusus menggantikan kenaikan semua harga.</p>
    {GROUPS.map(group => <section className="price-group" aria-labelledby={'group-' + group.category.replaceAll(' ', '-')} key={group.category}>
      <h4 id={'group-' + group.category.replaceAll(' ', '-')}>{group.category}</h4>
      <ul className="price-list">{group.products.map(product => {
        const id = product.id;
        const stem = 'row-' + id.replaceAll(':', '-').replaceAll('.', '-');
        const draft = overrides[id];
        const final = derived.finals[id];
        const rowIssue = derived.rowIssues[id] ?? (renderError?.field === id ? renderError.message : null);
        const lowConfidence = session.confidence[id] !== null && session.confidence[id]! < 70;
        return <li className="price-row" data-product={id} key={id}>
          <div className="row-heading"><div><p className="row-weight" id={stem + '-heading'}>{product.weight}</p>
            {lowConfidence && !reading && session.phase !== 'ready' ? <span className="warning-text">Periksa kembali hasil baca</span> : null}
          </div><div className="final-value"><span>Harga akhir</span><output aria-label={`Harga akhir ${product.category} ${product.weight}`} aria-live="off">
            {final === undefined ? 'Belum dihitung' : `Rp${formatRupiah(final)}`}
          </output></div></div>
          <div className="row-fields">
            <AmountInput id={stem + '-source'} label="Harga awal (Rp)" ariaLabel={`Harga awal (Rp) ${product.category} ${product.weight}`}
              kind="rupiah" value={session.drafts[id]} disabled={reading} required error={reading ? null : derived.sourceIssues[id]}
              onChange={text => actions.sourceText(id, text)} />
            <div className="field"><label htmlFor={stem + '-rule'}>Aturan kenaikan</label><select id={stem + '-rule'} name={stem + '-rule'} autoComplete="off" value={draft?.kind ?? 'global'}
              aria-label={`Aturan kenaikan ${product.category} ${product.weight}`}
              aria-describedby={rowIssue ? stem + (draft ? '-increase-error' : '-rule-error') : undefined}
              aria-invalid={rowIssue ? true : undefined} onChange={event => actions.rowKind(id, event.currentTarget.value as AmountKind | 'global')}>
              <option value="global">Ikuti semua</option><option value="rupiah">Khusus Rp</option><option value="percent">Khusus %</option>
            </select></div>
          </div>
          {draft ? <div className="override-field"><AmountInput id={stem + '-increase'} label={`Kenaikan khusus (${draft.kind === 'rupiah' ? 'Rp' : '%'})`}
            ariaLabel={`Kenaikan khusus (${draft.kind === 'rupiah' ? 'Rp' : '%'}) ${product.category} ${product.weight}`} kind={draft.kind} value={draft.text} required error={rowIssue}
            onChange={text => actions.rowText(id, text)} /></div>
            : rowIssue ? <p className="field-error" id={stem + '-rule-error'} aria-live="polite">{rowIssue} <a href="#global-value">Ubah kenaikan semua harga</a></p>
            : <p className="inherited-rule">Mengikuti kenaikan semua harga.</p>}
        </li>;
      })}</ul>
    </section>)}
    <div className="confirm-area"><button id="confirm-prices" type="button" className="primary" onClick={actions.confirm}
      disabled={reading || derived.knownCount !== PRODUCTS.length || session.phase === 'ready'} aria-describedby="review-help confirm-reason">
      {session.phase === 'ready' ? 'Harga awal sudah dikonfirmasi' : 'Konfirmasi harga awal'}
    </button><p className="hint" id="confirm-reason">{reading ? 'Tunggu pembacaan selesai.' : derived.knownCount !== PRODUCTS.length ? 'Lengkapi harga awal yang belum terbaca atau masih tidak valid.'
      : session.phase === 'ready' ? 'Kenaikan dan tanggal bisa diatur tanpa mengulang konfirmasi, selama harga awal tidak diubah.' : 'Pastikan semua angka sesuai foto. Mengubah harga awal akan meminta konfirmasi ulang.'}</p></div>
  </section>;
}
