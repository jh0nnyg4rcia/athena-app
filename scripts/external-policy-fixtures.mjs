// Somente dados sintéticos; não depende de snapshot real.
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {sha256,contentSha256} from './import-reviewed-questions.mjs';
import {extractCatalogBlock} from '../src/lib/catalogBlock.ts';
import {hashCatalogSnapshot,hashLessonContent} from '../src/services/legalReviewRepository.ts';
export function externalPolicyFixture({whole=false,status='pending_approval',candidateEdit=c=>c,day=2,part=0}={}){
 const f=syntheticFixture(),lesson=f.snapshot.lesson;lesson.id=`day_${day}_part_${part}`;lesson.day=day;lesson.part=part;
 f.input.lessonId=lesson.id;f.input.originalLessonSha256=sha256(lesson);f.input.originalContentSha256=contentSha256(lesson.content);
 f.input.questions[0].revised.correctIndex=f.input.questions[0].original.correctIndex;
 f.input.questions[0].approvedChanges=f.input.questions[0].approvedChanges.filter(c=>c.field!=='correctIndex');
 const state={lesson,reviewState:f.snapshot.reviewState,sections:Array.from({length:6},(_,n)=>({scopeId:`${lesson.id}_block_${n}`,index:null,reviews:[]})),readVersions:{[`homologated_lessons/${lesson.id}`]:{seconds:'1',nanoseconds:0}}};
 const group=whole?state.reviewState:state.sections[1],scope=whole?lesson.id:group.scopeId,content=whole?lesson.content:extractCatalogBlock(lesson.content,1);
 const reviewedMarkdown=status==='failed'?'':candidateEdit(content);
 const review={id:'synthetic-review',lessonId:scope,status,originalHash:hashCatalogSnapshot({...lesson,content}),originalContent:content,reviewedMarkdown,candidateHash:hashLessonContent(reviewedMarkdown),auditedCandidateHash:hashLessonContent(reviewedMarkdown),editorialIntegrity:{passed:true},changes:[],unverifiedClaims:[],...(!whole?{previewOnly:true,blockIndex:1,catalogLessonId:lesson.id}:{}),syntheticMetadata:{preserve:true}};
 group.reviews=[review];group.index={lessonId:scope,processingReviewId:null,latestReviewId:review.id,latestStatus:status};
 return {...f,state,review,group};
}
