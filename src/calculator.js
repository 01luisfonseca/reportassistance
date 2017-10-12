var moment=require('moment')

self.onmessage = ({data:obj}) => {
    //console.log(obj)
    self.postMessage(expensivefunction(obj));
};

function expensivefunction(obj){
    let tester=10,counterGen=1
    let general=obj.usuarios.datos.map(x=>{
        let gentradas=obj.entradas.datos.filter(m=>{return m['Cardholder Name'].indexOf(x.Name)>-1})
        let gsalidas=obj.salidas.datos.filter(m=>{return m['Cardholder Name'].indexOf(x.Name)>-1})
        return {
            nombre: (()=>{
                let acumulado=gentradas.concat(gsalidas),previus='',countNames=0
                acumulado.forEach(m=>{
                    if(previus!==m['Cardholder Name']) countNames++
                    previus=m['Cardholder Name']
                })
                if(countNames!==1) return x.Name
                else return previus
            })(),
            identificacion: x['Card number'],
            tiempoTotal:0,
            area:'',
            registros:(()=>{
                if(counterGen%10==0) console.log(counterGen)
                counterGen++
                let entradas=gentradas.map(x=>{return {
                    fecha: moment(x['Message Date/Time'].replace('.',''),'DD/MM/YYYY hh:mm:ss a'),
                    tipo:'ENTRADA'
                }})
                let salidas=gsalidas.map(x=>{return {
                    fecha: moment(x['Message Date/Time'].replace('.',''),'DD/MM/YYYY hh:mm:ss a'),
                    tipo:'SALIDA'
                }})

                // Filtro de fechas inválidas de menos de 2 minutos, por repeticion de huella
                let previus=''
                entradas=entradas.filter(m=>{
                    if(previus===''){
                        previus=m.fecha
                        return true // Primera fecha siempre pasa
                    }
                    let diff=m.fecha.diff(previus)
                    previus=m.fecha
                    return diff>60000 //Hay diferencia de mas de 1 minuto, pasa
                })
                previus=''
                salidas=salidas.filter(m=>{
                    if(previus===''){
                        previus=m.fecha
                        return true // Primera fecha siempre pasa
                    }
                    let diff=m.fecha.diff(previus)                        
                    previus=m.fecha
                    return diff>120000 //Hay diferencia de mas de 1 minuto, pasa
                })

                //if(tester>0) console.log('Paso 4. Eliminacion fechas inválidas',entradas,salidas)                    

                // Union de fechas para relacionar entradas y salidas
                let acumulado=entradas.concat(salidas)

                //if(tester>0) console.log('Paso 5. Registros concatenados',acumulado)                    
                

                // Ordenamiento de fechas según segundos UNIX
                acumulado=acumulado.sort((a,b)=>{return a.fecha.unix()-b.fecha.unix()})

                //if(tester>0) console.log('Paso 5. Registros ordenados por fecha',acumulado)
                
                // Verificación de entrada y salida
                // Este es el algoritmo que calcula la asistencia
                let registros=[],entra=null,sale=null,equilibrio=0
                for (var l = 0; l < acumulado.length; l++) {
                    var acum = acumulado[l];
                    if(acum.tipo=='ENTRADA'){
                        entra=acum
                        if(equilibrio===0){
                            // Quiere decir que es la primera entrada, se hace punto para recibir salida
                            equilibrio=1
                        }else{
                            // Quiere decir que ya se hizo una entrada previa, por lo que se anula la entrada previa
                            registros.push({
                                entrada:entra.fecha,
                                salida:null,
                                tiempo:0
                            })
                            entra=acum
                            sale=null                         
                        }
                    }else{
                        sale=acum
                        if(equilibrio===1){
                            if(entra.fecha.dayOfYear()==sale.fecha.dayOfYear()){
                                // Si pasa quiere decir que existe un registro de entrada y uno de salida bien, el mismo dia
                                registros.push({
                                    entrada:entra.fecha,
                                    salida:sale.fecha,
                                    tiempo:sale.fecha.diff(entra.fecha)
                                })
                                equilibrio=0
                                entra=null
                                sale=null
                            }else{
                                // Acá significa que salio otro día, por lo que es una entrada erronea
                                registros.push({
                                    entrada:entra.fecha,
                                    salida:null,
                                    tiempo:0
                                })
                                equilibrio=0
                                entra=null
                                sale=null
                            }
                        }else{
                            // Significa que no hay una entrada previa, por lo que es una salida inválida
                            registros.push({
                                entrada:null,
                                salida:sale.fecha,
                                tiempo:0
                            })
                            equilibrio=0
                            entra=null
                            sale=null
                        }
                    }
                }
                
                //if(tester>0) console.log('Paso 6. Registros calculados',registros)                    

                tester--

                return registros
            })()
        }
    })

    // Acumulación global del tiempo en milisegundos
    general.forEach(x=>{
        // Quita espacios innecesarios al nombre
        let temporalNames=x.nombre.split(',')
        for (var i = 0; i < temporalNames.length; i++) {
            temporalNames[i] = temporalNames[i].trim()
        }
        x.nombre=temporalNames.toString()

        // Cuenta de tiempos y formato de fechas.
        x.registros.forEach(m=>{
            m.tiempo = Number((m.tiempo/(1000*60*60)))//.toFixed(1)) // En horas
            x.tiempoTotal += m.tiempo
            m.tiempo=hoursToTime(m.tiempo) // Aplicando formato HH:mm
            m.fecha= m.entrada?  m.entrada.format('DD-MM-YYYY') : m.salida.format('DD-MM-YYYY')
            m.entrada = m.entrada? m.entrada.format('h:mm a'): m.entrada
            m.salida = m.salida? m.salida.format('h:mm a'): m.salida
        })
        x.tiempoTotal = hoursToTime(x.tiempoTotal) // Aplicando formato HH:mm
    })

    general.sort((a, b)=>{
        if(a.nombre < b.nombre) return -1;
        if(a.nombre > b.nombre) return 1;
        return 0;
    })

    return general
}

function hoursToTime(hours){
    let floor=Math.floor(hours)
    let mins=hours-floor
    mins=mins*60
    mins=Math.floor(mins)
    let formateado=floor<10?'0':''
    formateado += floor
    formateado += mins<10?':0':':'
    formateado += mins
    return formateado
}