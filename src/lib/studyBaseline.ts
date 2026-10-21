export type StudyBaseline={version:number;sha256:string};
export function assertStudyBaseline(current:{lessonVersion:number;lessonSha256:string},shown?:StudyBaseline){
  if(!shown || !Number.isSafeInteger(shown.version) || !/^[a-f0-9]{64}$/.test(shown.sha256) || shown.version!==current.lessonVersion || shown.sha256!==current.lessonSha256)throw Error('DISPLAYED_BASELINE_CHANGED');
}
export async function hashStudyContent(content:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
