function Min(options={}){
  this.$options=options;
  let data=this._data=options.data;
  for(let key in data){//数据代理：本来访问this._data,可直接访问。
    Object.defineProperty(this,key,{
      enumerable:true,
      get(){
        return data[key];
      },
      set(newVal){ 
        data[key]=newVal
      }
    })
  }
  observe(data);
  initComputed.call(this);
  new Compile(options.el,this);
}

function initComputed(){
  let vm=this;
  let computed = this.$options.computed;
  Object.keys(computed).forEach(key=>{
    Object.defineProperty(vm,key,{
      get:typeof computed[key]==='function' ? computed[key] : computed[key].get,
      set(){},
    })
  })
}

function Compile(el,vm){//编译模板：把节点对象down到内存中提取{{}}中的变量，并把变量的值加进去。
  vm.$el=document.querySelector(el);
  let fragment = document.createDocumentFragment()
  while(child=vm.$el.firstChild){//把节点移到内存
    fragment.appendChild(child);
  }
  replace(fragment);
  function replace(fragment){
    Array.from(fragment.childNodes).forEach(node=>{
      let reg=/\{\{(.*)\}\}/;
      let text=node.textContent;
      if(node.nodeType===3 && reg.test(text)){
        let arr=RegExp.$1.split("."),val=vm;
        arr.forEach(v=>{
          val=val[v];
        })
        new Watcher(vm,RegExp.$1,function(newVal){
          node.textContent=text.replace(/\{\{(.*)\}\}/,newVal);
        })
        node.textContent=text.replace(/\{\{(.*)\}\}/,val);
      }
      if(node.nodeType==1){//元素节点
        let attributes=node.attributes
        Array.from(attributes).forEach(attr=>{
          let name=attr.name,exp=attr.value;
          if(name.indexOf("v-model")==0){
            new Watcher(vm,exp,function(newVal){
              node.value=newVal;
            })
            node.value=vm[exp];
            node.addEventListener('input',e=>{
              let value=e.target.value;
              console.log('value',value);
              vm[exp]=value;
            })
          }
        })
      }
      if(node.childNodes) replace(node);
    })
  }
  vm.$el.appendChild(fragment)
}

function Observe(data){
  let dep=new Dep();  
  for(let key in data){
    let val=data[key];
    observe(val);
    Object.defineProperty(data,key,{
      enumerable:true,
      get(){
        Dep.target && dep.addSub(Dep.target)
        return val;
      },
      set(newVal){
        if(newVal===val) return;
        val=newVal;
        observe(newVal);
        dep.notify();
      }
    })
  }
}

function observe(data){//数据劫持：为每一个对象设置get，set
  if(typeof data!=='object') return;
  return new Observe(data);
}


//发布订阅
function Dep(){
  this.subs=[];
}
Dep.prototype.addSub=function (sub){
  this.subs.push(sub);
  console.log('我进来了sub',this.subs);
}
Dep.prototype.notify=function (){
  this.subs.forEach(fn=>fn.update())
}

function Watcher(vm,exp,fn){
  this.vm=vm;
  this.exp=exp;
  this.fn=fn;
  Dep.target=this;
  let val=vm;
  let arr=exp.split(".");
  arr.forEach(key=>{
    val=val[key];
  })
  // Dep.target=null;
}
Watcher.prototype.update=function(){
  let val=this.vm;
  let arr=this.exp.split(".");
  arr.forEach(key=>{
    val=val[key];
  })
  this.fn(val);
}

















