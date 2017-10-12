<template>
<div class="container-fluid">
  <div class="row justify-content-center">
    <div class="col">
    <form  @submit.prevent="validateBeforeSubmit">
      <div class="form-group">
        <label for="userInputFile"><strong>Usuarios y Tarjetas.</strong></label>
        <input type="file" accept=".csv" name="usuarios" class="form-control-file" @change="ajustarCSV($event.target.name, $event.target.files)" id="userInputFile" aria-describedby="userFileHelp">
        <small id="userFileHelp" class="form-text text-muted">Seleccione la ubicacion del archivo CSV (Con ";").</small>
      </div>
      <div class="form-group">
        <label for="adicionalInputFile"><strong>Info especial de Usuario.</strong></label>
        <input type="file" accept=".csv" name="adicional" class="form-control-file" @change="ajustarCSV($event.target.name, $event.target.files)" id="adicionalInputFile" aria-describedby="adicionalFileHelp">
        <small id="entradaFileHelp" class="form-text text-muted">Seleccione la ubicacion del archivo CSV (Con ";").</small>
      </div>
      <div class="form-group">
        <label for="entradaInputFile"><strong>Entradas de Usuario.</strong></label>
        <input type="file" accept=".csv" name="entradas" class="form-control-file" @change="ajustarCSV($event.target.name, $event.target.files)" id="entradaInputFile" aria-describedby="entradaFileHelp">
        <small id="entradaFileHelp" class="form-text text-muted">Seleccione la ubicacion del archivo CSV (Con ";").</small>
      </div>
      <div class="form-group">
        <label for="salidaInputFile"><strong>Salidas de Usuario.</strong></label>
        <input type="file" accept=".csv" name="salidas" class="form-control-file" @change="ajustarCSV($event.target.name, $event.target.files)" id="salidaInputFile" aria-describedby="salidaFileHelp">
        <small id="salidaFileHelp" class="form-text text-muted">Seleccione la ubicacion del archivo CSV (Con ";").</small>
      </div>
      <input v-if='datosfull && !cargando' class="btn btn-primary" type="submit" value="Calcular Tabla">
      <a v-show='finaltable.length>0' @click='exportGeneral' class='btn btn-primary'>Exportar CSV General</a>
      <a v-show='finaltable.length>0' @click='exportDetallado' class='btn btn-primary'>Exportar CSV Detallado</a>
      <h4 v-show="cargando"><strong>Estamos cargando la solicitud....</strong></h4>
    </form>
    <br/>
    <div v-if='finaltable.length>0' class="table-responsive">
      <table class="table table-condensed table-stripped">
        <thead>
          <tr>
            <th>IDENTIFICACION</th>
            <th>USUARIO</th>
            <th>TIEMPO TOTAL</th>
            <th>EVENTOS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ft,idx) in finaltable" v-if="idx<50">
            <td>{{ft.identificacion}}</td>
            <td>{{ft.nombre}}</td>
            <td>{{ft.tiempoTotal}}</td>
            <td>
              <table class="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Tiempo</th>
                  </tr>                
                </thead>
                <tbody>
                  <tr v-for="reg in ft.registros">
                    <td>{{reg.fecha}}</td>
                    <td>{{reg.entrada}}</td>
                    <td>{{reg.salida}}</td>
                    <td>{{reg.tiempo}}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </div>
</div>
</template>

<script>
import {parser,combinador,jsonToCSV} from '@/logic'
import Vue from 'vue'
let FileSaver=require('file-saver') 

export default {
  name: 'Dashboard',
  data () {
    return {
      finaltable:[],
      usuarios:'',
      entradas:'',
      salidas:'',
      adicional:'',
      cargando:false
    }
  },
  computed:{
    datosfull(){return this.usuarios!=='' && this.entradas!=='' && this.salidas!=='' && this.adicional!==''}
  },
  methods:{
    exportGeneral(){
      let result=[]
      this.finaltable.forEach((el)=>{
        result.push({
          'IDENTIFICACION':el.identificacion,
          'NOMBRE':el.nombre,
          'PROCESO':el.area,
          'CARGO':el.cargo,
          'VINCULACION':el.vinculacion,
          'TOTAL':el.tiempoTotal
        })
      })
      let resp=jsonToCSV(result)
      //console.log(resp)
      let blob=new Blob([resp], {type: "text/plain;charset=utf-8"})
      FileSaver.saveAs(blob, "General.csv")
    },
    exportDetallado(){
      let result=[]
      this.finaltable.forEach((el)=>{
        el.registros.forEach(reg=>{
          result.push({
            'IDENTIFICACION':el.identificacion,
            'NOMBRE':el.nombre,
            'PROCESO':el.area,
            'CARGO':el.cargo,
            'VINCULACION':el.vinculacion,
            'FECHA':reg.fecha,
            'HORA ENTRA':reg.entrada,
            'HORA SALE':reg.salida,
            'TIEMPO EN INSTALACIONES':reg.tiempo,
          })
        })
      })
      let resp=jsonToCSV(result)
      //console.log(resp)
      let blob=new Blob([resp], {type: "text/plain;charset=utf-8"})
      FileSaver.saveAs(blob, "Detallado.csv")
    },
    validateBeforeSubmit(){
      this.cargando=true
      combinador({
        usuarios:this.usuarios,
        entradas:this.entradas,
        salidas:this.salidas,
        adicional:this.adicional
      }).then(
        (dt)=>{
          this.cargando=false
          //alert('Calculo exitoso')
          //console.log('Combinado',dt)
          this.finaltable=dt
        },
        (e)=>{
          this.cargando=false
          alert('Error. Ver consola')          
          console.error('Error',e)
        }
      )
    },
    ajustarCSV(iname,ifilesev){
      //console.log(iname,ifilesev)
      parser(ifilesev[0]).then(
        (dt)=>{
          Vue.set(this, iname, dt) //this[iname]=dt
        },
        (e)=>{
          Vue.set(this, iname, '') //this[iname]=''
          console.error('Falla',e)
        }
      )
    }
  }
}
</script>