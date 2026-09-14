import { useRef, useState } from 'react';
import { unggahBerkas } from '../supabaseClient';

// Editor sederhana berbasis contentEditable + execCommand, dengan
// sistem "penanda posisi" agar sisipan (link/gambar/video) selalu
// masuk tepat di posisi kursor, bukan selalu di awal.
export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const markerRef = useRef(null);
  const [popup, setPopup] = useState(null); // 'link' | 'video' | null
  const [modeKode, setModeKode] = useState(false);
  const [kodeHtml, setKodeHtml] = useState(value || '');
  const [linkTeks, setLinkTeks] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoErr, setVideoErr] = useState('');

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const laporkanPerubahan = () => onChange(editorRef.current.innerHTML);

  const jalankan = (cmd) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, null);
    laporkanPerubahan();
  };

  const sisipkanPenanda = () => {
    const editorEl = editorRef.current;
    editorEl.focus();
    const sel = window.getSelection();
    let range;
    if (sel && sel.rangeCount > 0 && editorEl.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0).cloneRange();
    } else {
      range = document.createRange();
      range.selectNodeContents(editorEl);
      range.collapse(false);
    }
    const idPenanda = 'penanda-' + uid();
    const span = document.createElement('span');
    span.id = idPenanda;
    span.textContent = '\u200b';
    range.deleteContents();
    range.insertNode(span);
    markerRef.current = idPenanda;
  };

  const gantiPenanda = (htmlBaru) => {
    const marker = document.getElementById(markerRef.current);
    if (marker) {
      const temp = document.createElement('span');
      temp.innerHTML = htmlBaru;
      marker.replaceWith(...temp.childNodes);
    } else {
      editorRef.current.insertAdjacentHTML('beforeend', htmlBaru);
    }
    laporkanPerubahan();
  };

  const hapusPenanda = () => {
    const marker = document.getElementById(markerRef.current);
    if (marker) marker.remove();
  };

  const bukaPopupLink = () => { sisipkanPenanda(); setLinkTeks(''); setLinkUrl(''); setPopup('link'); };
  const batalLink = () => { hapusPenanda(); setPopup(null); };
  const okLink = () => {
    if (!linkUrl.trim()) { hapusPenanda(); setPopup(null); return; }
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    gantiPenanda(`<a href="${esc(linkUrl.trim())}" target="_blank" rel="noopener">${esc(linkTeks.trim() || linkUrl.trim())}</a>`);
    setPopup(null);
  };

  const extractYoutubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const bukaPopupVideo = () => { sisipkanPenanda(); setVideoUrl(''); setVideoErr(''); setPopup('video'); };
  const batalVideo = () => { hapusPenanda(); setPopup(null); };
  const okVideo = () => {
    const id = extractYoutubeId(videoUrl.trim());
    if (!id) { setVideoErr('Link YouTube tidak dikenali.'); return; }
    gantiPenanda(`<div class="video-embed" contenteditable="false"><iframe src="https://www.youtube.com/embed/${id}" title="Video YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><span>\u200b</span>`);
    setPopup(null);
  };

  const bukaKode = () => { setKodeHtml(editorRef.current.innerHTML); setModeKode(true); };
  const tutupKode = () => {
    editorRef.current.innerHTML = kodeHtml;
    setModeKode(false);
    onChange(kodeHtml);
  };

  const klikGambar = () => { sisipkanPenanda(); fileRef.current.click(); };
  const gambarDipilih = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url } = await unggahBerkas(file, 'berita');
      gantiPenanda(`<img src="${url}" alt="">`);
    } catch (err) {
      hapusPenanda();
      alert('Gagal mengunggah gambar: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="editor-toolbar" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', border: '1px solid var(--line)', borderBottom: 'none', borderRadius: '4px 4px 0 0', padding: '6px 8px', background: 'var(--paper)' }}>
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', opacity: modeKode ? 0.4 : 1, pointerEvents: modeKode ? 'none' : 'auto' }}>
          <select onChange={(e) => { editorRef.current.focus(); document.execCommand('formatBlock', false, e.target.value); e.target.selectedIndex = 0; laporkanPerubahan(); }} defaultValue="">
            <option value="" disabled>Format</option>
            <option value="P">Paragraf</option>
            <option value="H1">Judul 1</option>
            <option value="H2">Judul 2</option>
            <option value="H3">Judul 3</option>
            <option value="BLOCKQUOTE">Kutipan</option>
          </select>
          <button type="button" onClick={() => jalankan('bold')}><b>B</b></button>
          <button type="button" onClick={() => jalankan('italic')}><i>I</i></button>
          <button type="button" onClick={() => jalankan('underline')}><u>U</u></button>
          <button type="button" onClick={() => jalankan('strikeThrough')}><s>S</s></button>
          <button type="button" onClick={() => jalankan('insertUnorderedList')}>• List</button>
          <button type="button" onClick={() => jalankan('insertOrderedList')}>1. List</button>
          <button type="button" onClick={() => jalankan('justifyLeft')}>⇤</button>
          <button type="button" onClick={() => jalankan('justifyCenter')}>≡</button>
          <button type="button" onClick={() => jalankan('justifyRight')}>⇥</button>
          <button type="button" onClick={bukaPopupLink}>🔗</button>
          <button type="button" onClick={() => jalankan('unlink')}>🔗✕</button>
          <button type="button" onClick={klikGambar}>🖼</button>
          <button type="button" onClick={bukaPopupVideo}>▶️</button>
          <button type="button" onClick={() => jalankan('insertHorizontalRule')}>―</button>
          <button type="button" onClick={() => jalankan('undo')}>↶</button>
          <button type="button" onClick={() => jalankan('redo')}>↷</button>
          <button type="button" onClick={() => jalankan('removeFormat')}>⌫format</button>
        </span>
        <button type="button" onClick={modeKode ? tutupKode : bukaKode} title="Lihat/edit kode HTML — bisa tempel iframe/embed langsung di sini" style={{ fontWeight: 600 }}>
          {modeKode ? '✓ Selesai' : '</> Kode HTML'}
        </button>
      </div>

      {modeKode ? (
        <textarea
          value={kodeHtml}
          onChange={(e) => setKodeHtml(e.target.value)}
          style={{ width: '100%', minHeight: 160, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '0 0 4px 4px', padding: '10px 12px', fontSize: '.82rem', fontFamily: "'Courier New',monospace", lineHeight: 1.6 }}
          placeholder="Tempel kode HTML di sini, mis. <iframe> untuk video, lalu klik ✓ Selesai"
        />
      ) : (
        <div
          ref={editorRef}
          className="editor-area"
          contentEditable
          suppressContentEditableWarning
          style={{ minHeight: 160, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '0 0 4px 4px', padding: '10px 12px', fontSize: '.92rem', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={laporkanPerubahan}
          onPaste={(e) => {
            e.preventDefault();
            const teks = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, teks);
            laporkanPerubahan();
          }}
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={gambarDipilih} />

      {popup === 'link' && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="field"><label>Teks yang ditampilkan (opsional)</label><input value={linkTeks} onChange={(e) => setLinkTeks(e.target.value)} /></div>
          <div className="field"><label>URL tautan</label><input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." /></div>
          <button className="btn btn-small" onClick={okLink}>Sisipkan</button>{' '}
          <button className="btn-ghost btn-small" onClick={batalLink}>Batal</button>
        </div>
      )}
      {popup === 'video' && (
        <div className="card" style={{ marginTop: 10 }}>
          <div className="field"><label>Tempel link video YouTube</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></div>
          {videoErr && <div className="notice err">{videoErr}</div>}
          <button className="btn btn-small" onClick={okVideo}>Sisipkan</button>{' '}
          <button className="btn-ghost btn-small" onClick={batalVideo}>Batal</button>
        </div>
      )}
    </div>
  );
}
