// Pure reading helpers. Translation data is loaded only when Reading is opened.
export function readingPages(text,maxWords=45,maxBlocks=2){
 const chunks=[];
 text.blocks.forEach((block,blockIndex)=>{
  let start=0,count=0;
  block.tokens.forEach((token,index)=>{
   if(token.glossId&&count>=maxWords){chunks.push({blockIndex,start,speaker:start===0?block.speaker:'',tokens:block.tokens.slice(start,index),wordCount:count});start=index;count=0;}
   if(token.glossId)count++;
  });
  if(start<block.tokens.length)chunks.push({blockIndex,start,speaker:start===0?block.speaker:'',tokens:block.tokens.slice(start),wordCount:count});
 });
 const pages=[];let page=[],count=0;
 for(const chunk of chunks){
  if(page.length&&(count+chunk.wordCount>maxWords||page.length>=maxBlocks)){pages.push(page);page=[];count=0;}
  page.push(chunk);count+=chunk.wordCount;
 }
 if(page.length)pages.push(page);
 return pages;
}
export function readingLookup(library,textId,blockIndex,tokenIndex){
 if(!Number.isInteger(blockIndex)||!Number.isInteger(tokenIndex)||blockIndex<0||tokenIndex<0)return null;
 const text=library?.texts.find(t=>t.id===textId),token=text?.blocks[blockIndex]?.tokens[tokenIndex];
 const gloss=token?.glossId&&library.glossary[token.glossId];
 return gloss?{surface:token.text,...gloss}:null;
}
