// A calculator for block dimensions, without evaluating JavaScript.
export function dimensionExpression(source,{min=-Infinity,max=Infinity}={}){
 const text=String(source).trim().replace(/^=/,'').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');let at=0,depth=0;
 const space=()=>{while(/\s/.test(text[at]||'')&&at<text.length)at++;};
 const finite=value=>{if(!Number.isFinite(value))throw Error('计算结果必须是有限数值');return value;};
 function atom(){space();if(++depth>64)throw Error('表达式括号过深');let value;const sign=text[at];if(sign==='+'||sign==='-'){at++;value=(sign==='-'?-1:1)*atom();}else if(sign==='('){at++;value=sum();space();if(text[at++]!==')')throw Error('缺少右括号');}else{const match=text.slice(at).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);if(!match)throw Error('需要数字或括号');at+=match[0].length;value=Number(match[0]);}depth--;return finite(value);}
 function product(){let value=atom();for(;;){space();const op=text[at];if(op!=='*'&&op!=='/')return value;at++;const right=atom();if(op==='/'&&right===0)throw Error('不能除以零');value=finite(op==='*'?value*right:value/right);}}
 function sum(){let value=product();for(;;){space();const op=text[at];if(op!=='+'&&op!=='-')return value;at++;const right=product();value=finite(op==='+'?value+right:value-right);}}
 if(!text)throw Error('请输入尺寸或计算式');const value=sum();space();if(at!==text.length)throw Error('仅支持数字、加减乘除和括号');if(value<min)throw Error('结果不能小于 '+min);if(value>max)throw Error('结果不能大于 '+max);return value;
}
const plain=text=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim());
export function dimensionInput(input,{pending=()=>{},resolved=()=>{}}={}){
 input.type='text';input.inputMode='decimal';input.dataset.dimensionExpression='true';input.title='可输入计算式，如 (12+4)/2；Enter 或离开输入框采用，Esc 恢复原值';let accepted=input.value,dirty=false,dispatching=false;
 const parse=()=>dimensionExpression(input.value,{min:input.min===''?-Infinity:Number(input.min),max:input.max===''?Infinity:Number(input.max)});
 function accept(notify=true){try{const value=parse();input.value=String(Number(value.toPrecision(15)));input.setCustomValidity('');input.removeAttribute('aria-invalid');delete input.dataset.expressionPending;accepted=input.value;dirty=false;resolved(input);if(notify&&!dispatching){dispatching=true;try{input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}finally{dispatching=false;}}return true;}catch(error){input.setCustomValidity(error.message);input.setAttribute('aria-invalid','true');input.dataset.expressionPending='true';pending(input,error.message);return false;}}
 function restore(){input.value=accepted;input.setCustomValidity('');input.removeAttribute('aria-invalid');delete input.dataset.expressionPending;dirty=false;resolved(input);}
 input.addEventListener('focus',()=>{if(!input.dataset.expressionPending)accepted=input.value;});
 input.addEventListener('input',event=>{if(dispatching)return;dirty=true;let value;try{value=parse();input.setCustomValidity('');input.removeAttribute('aria-invalid');}catch(error){input.setCustomValidity(error.message);input.setAttribute('aria-invalid','true');input.dataset.expressionPending='true';pending(input,error.message);event.stopImmediatePropagation();return;}if(!plain(input.value)){input.dataset.expressionPending='true';pending(input,'计算结果 '+Number(value.toPrecision(15))+'；按 Enter 或离开输入框采用');event.stopImmediatePropagation();}else{delete input.dataset.expressionPending;resolved(input);}},true);
 input.addEventListener('change',event=>{if(dispatching)return;if(dirty){if(!accept(false)){event.stopImmediatePropagation();return;}dispatching=true;try{input.dispatchEvent(new Event('input',{bubbles:true}));}finally{dispatching=false;}}},true);
 input.addEventListener('blur',()=>{if(dirty||input.dataset.expressionPending)accept();});
 input.addEventListener('keydown',event=>{if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();accept();}else if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();restore();dispatching=true;try{input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}finally{dispatching=false;}}});
 return{restore};
}
