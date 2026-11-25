// Tempo gasto por cliente: horas que cada setor (Contábil, Fiscal, Trabalhista, BPO) gasta com cada empresa
// em cada competência, como a planilha "Análise dos dados de tempo gasto por departamento" do Edval
// (12 meses por departamento). Lançamento manual por enquanto; depois pode vir do relatório "Tempo Gasto
// por Cliente" do Domínio e do PlayBPO. A média da empresa no mês é total de horas ÷ setores; no período,
// a média mensal conta só os meses com tempo lançado.
(function () {
const SETORES = { contabil: 'Contábil', fiscal: 'Fiscal', trabalhista: 'Trabalhista', bpo: 'BPO' };
const MAX_HORAS = 1000;

const r1 = (n) => Math.round(n * 10) / 10;

// Aceita 12, "12", "12,5", "12.5" e "12:30" (horas:minutos). Vazio = null (setor sem tempo informado).
function lerHoras(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 && v <= MAX_HORAS ? v : NaN;
  const t = String(v).trim();
  if (!t) return null;
  const hm = t.match(/^(\d{1,4}):([0-5]\d)$/);
  const n = hm ? Number(hm[1]) + Number(hm[2]) / 60 : /^\d+([.,]\d+)?$/.test(t) ? Number(t.replace(',', '.')) : NaN;
  return n >= 0 && n <= MAX_HORAS ? n : NaN;
}

// setores: { contabil: 12, fiscal: 8, ... } — a chave presente = empresa tem o setor; valor null = sem tempo ainda.
function resumoEmpresa(setores) {
  const chaves = Object.keys(SETORES).filter((k) => setores && k in setores);
  const comHoras = chaves.filter((k) => typeof setores[k] === 'number');
  const total = comHoras.reduce((s, k) => s + setores[k], 0);
  return { setores: chaves.length, informados: comHoras.length, totalHoras: r1(total),
    mediaPorSetor: comHoras.length ? r1(total / comHoras.length) : null, completo: chaves.length > 0 && comHoras.length === chaves.length };
}

// lista: [{ setores }]. Empresas sem nenhum setor ficam fora das médias.
function resumoGeral(lista) {
  const porSetor = Object.fromEntries(Object.keys(SETORES).map((k) => [k, { empresas: 0, totalHoras: 0, media: null }]));
  let empresas = 0, totalHoras = 0, setoresInformados = 0;
  for (const item of lista || []) {
    const s = item.setores || {};
    const r = resumoEmpresa(s);
    if (!r.informados) continue;
    empresas++; totalHoras += r.totalHoras; setoresInformados += r.informados;
    for (const k of Object.keys(SETORES)) if (typeof s[k] === 'number') { porSetor[k].empresas++; porSetor[k].totalHoras += s[k]; }
  }
  for (const p of Object.values(porSetor)) { p.media = p.empresas ? r1(p.totalHoras / p.empresas) : null; p.totalHoras = r1(p.totalHoras); }
  return { empresas, totalHoras: r1(totalHoras), setoresInformados,
    mediaPorEmpresa: empresas ? r1(totalHoras / empresas) : null,
    mediaPorSetor: setoresInformados ? r1(totalHoras / setoresInformados) : null,
    mediaSetoresPorEmpresa: empresas ? r1(setoresInformados / empresas) : null, porSetor };
}

// historico: { 'AAAA-MM': { contabil: 12, ... } }. Resumo de uma empresa no período.
function resumoPeriodo(historico) {
  const porSetor = Object.fromEntries(Object.keys(SETORES).map((k) => [k, { meses: 0, totalHoras: 0, mediaMensal: null }]));
  const porMes = {};
  let totalHoras = 0;
  for (const [comp, setores] of Object.entries(historico || {})) {
    const r = resumoEmpresa(setores);
    if (!r.informados) continue;
    porMes[comp] = r.totalHoras;
    totalHoras += r.totalHoras;
    for (const k of Object.keys(SETORES)) if (typeof setores[k] === 'number') { porSetor[k].meses++; porSetor[k].totalHoras += setores[k]; }
  }
  for (const p of Object.values(porSetor)) { p.mediaMensal = p.meses ? r1(p.totalHoras / p.meses) : null; p.totalHoras = r1(p.totalHoras); }
  const meses = Object.keys(porMes).length;
  return { meses, totalHoras: r1(totalHoras), mediaMensal: meses ? r1(totalHoras / meses) : null, porMes, porSetor };
}

const BraskerFechamento = { SETORES, MAX_HORAS, lerHoras, resumoEmpresa, resumoGeral, resumoPeriodo };
if (typeof module !== 'undefined') module.exports = BraskerFechamento; else globalThis.BraskerFechamento = BraskerFechamento;
})();
