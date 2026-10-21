// Catalog membership is established by the published document, never by ID alone.
export function editorialSlot(id){const m=typeof id==='string'&&/^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(id);if(!m||+m[1]>100)throw Error('EDITORIAL_SCOPE');return{day:+m[1],part:+m[2]};}
const normalized=s=>typeof s==='string'?s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase():'';
const aliases={'CONSTITUICAO FEDERAL':'DIREITO CONSTITUCIONAL','PROCESSO CIVIL':'DIREITO PROCESSUAL CIVIL','PROCESSO PENAL':'DIREITO PROCESSUAL PENAL','LINDB':'LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO','LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO (LINDB)':'LEI DE INTRODUCAO AS NORMAS DO DIREITO BRASILEIRO'};
const subject=s=>aliases[normalized(s)]??normalized(s);
export function validateEditorialCatalog(state,document){
 const slot=editorialSlot(document.lessonId),l=state?.lesson,c=state?.catalogEntry,fail=code=>{throw Error(code);};
 if(!l||l.id!==document.lessonId||l.day!==slot.day||l.part!==slot.part||l.status!=='approved'||!Number.isSafeInteger(l.version)||l.version<1)fail('EDITORIAL_PUBLISHED_METADATA');
 if(!c||c.id!==l.id||c.day!==slot.day||c.part!==slot.part||c.status!=='approved')fail('EDITORIAL_CATALOG_MEMBERSHIP');
 if(!subject(document.subject)||subject(document.subject)!==subject(l.subject)||subject(l.subject)!==subject(c.subject))fail('EDITORIAL_SUBJECT_DIVERGENCE');
 if(c.version!==undefined&&c.version!==l.version)fail('EDITORIAL_CATALOG_VERSION');
 return slot;
}
