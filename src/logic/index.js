import papa from 'papaparse'
var moment=require('moment')
import Worker from 'worker-loader!../calculator.js';

const worker = new Worker();

function parser(mfile){
    let prom=new Promise((res,rej)=>{
        papa.parse(mfile,{
            delimiter:';',
            complete:(results, file)=>{
                //console.log(results, file)
                let i=0,globalLength
                // Filtro para eliminar espacios en blanco y de 1 columna. Deben ser al menos 2 columnas
                // Elimina la cabecera y deja el título
                let filtrado=results.data.filter(x=>{return x.length>1})
                //console.log('Paso 1',filtrado)

                // Se permite un título, se determina el monto total del título, y se eliminan los otros
                // titulos entre lineas
                filtrado=filtrado.filter(x=>{
                    if(i==0) {i++;globalLength=filtrado[0].length;return true}
                    i++
                    return filtrado[0][0]!==x[0]
                })
                //console.log('Paso 2',filtrado)
                //console.log(globalLength)

                // Se recortan los titulos y campos de mas de 10.
                if(globalLength>10){
                    globalLength=10
                    //let tester=5
                    filtrado=filtrado.map(x=>{
                        let tempo=[]
                        for (var m = 0; m < x.length; m++) {
                            if(m<globalLength) tempo.push(x[m])                            
                        }
                        //if(tester>0) console.log(tempo)
                        //tester--
                        return tempo
                    })
                    //console.log('Paso 2.1',filtrado)
                } 

                // Se eliminan los registros que no tienen la longitud requerida
                filtrado=filtrado.filter(x=>{return x.length==globalLength})
                //console.log("Parsing complete:", filtrado, file);
                let obj={
                    titulos:filtrado[0],
                    datos:filtrado.map(x=>{
                        let obj={}
                        for (var index = 0; index < x.length; index++) {
                            var actual = x[index];
                            obj[filtrado[0][index]]=actual
                        }
                        return obj
                    })
                }
                obj.datos.shift()
                res(obj)
            },
            error:()=>{rej(arguments)}
        })
    })
    return prom
}

function combinador(obj){
    let prom=new Promise((res,rej)=>{
        worker.postMessage(obj)
        worker.addEventListener(
            'message',
            ({data:obj}) => {
                //console.log(obj)
                res(obj)
            }
        )
        worker.addEventListener(
            'error', rej
        )
    })
    return prom
}

function jsonToCSV(json){
    return papa.unparse(json,{
        delimiter:';'
    })
}

export {parser,combinador,jsonToCSV}