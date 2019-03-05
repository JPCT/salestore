'use strict';

// se crea un nuevo objeto anónimo a partir de una clase anónima
// dicho objeto define la gestión de productos, utilizando el componente 'Tabulator' (http://tabulator.info/)

new class Producto {

    constructor() {

        this.contenedor = '#tabla-productos'; // el div que contendrá la tabla de datos de productos
        this.url = './controlador/fachada.php'; // la url del controlador de fachada
        this.filasPorPagina = 7;

        this.parametros = { // parámetros que se envían al servidor para mostrar la tabla
            clase: 'Producto',
            accion: 'seleccionar'
        };

        this.columnas = [ // este array de objetos define las columnas de la tabla
            { // la primera columna incluye los botones para actualizar y eliminar
                title: 'Control',
                headerSort: false,
                width: 65,
                align: "center",
                formatter: (cell, formatterParams) => {
                    // en cada fila, en la primera columna, se asignan los botones de editar y actualizar 
                    return `<i id="tabulator-btnactualizar" class="material-icons teal-text">edit</i>
                            <i id="tabulator-btneliminar" class="material-icons deep-orange-text">delete</i>`;
                },
                cellClick: (e, cell) => {
                    // define qué hacer si se pulsan los botones de actualizar o eliminar
                    this.operacion = e.target.id === 'tabulator-btnactualizar' ? 'actualizar' : 'eliminar';
                    this.filaActual = cell.getRow(); // se obtienen los datos correctamente

                    if (this.operacion === 'actualizar') {
                        this.editarRegistro();
                    } else if (this.operacion === 'eliminar') {
                        this.eliminarRegistro();
                    }
                }
            },
            { title: 'ID', field: 'id_producto', visible: false },
            { title: 'Categoría', field: 'categoria', width: 100 },
            { title: 'Presentación', field: 'presentacion', width: 100 },
            { title: 'Nombre', field: 'nombre', width: 200 },
            { title: 'Precio', field: 'precio', align: 'right', formatter: "money" },
            { title: 'Disponible', field: 'cantidad_disponible', align: 'center', width: 70 },
            { title: 'Mínimo', field: 'cantidad_minima', align: 'center', width: 70 },
            { title: 'Máximo', field: 'cantidad_maxima', align: 'center', width: 70 }
        ];

        this.ordenInicial = [ // establece el orden inicial de los datos
            { column: 'nombre', dir: 'asc' }
        ]

        this.indice = 'id_producto'; // estable la PK como índice único para cada fila de la tabla visualizada
        this.tabla = this.generarTabla();
        this.filaActual; // guarda el objeto "fila actual" cuando se elige actualizar o eliminar sobre una fila
        this.operacion; // insertar | actualizar | eliminar

        this.frmEdicionProducto = M.Modal.init($('#producto-frmedicion'), {
            dismissible: false, // impedir el acceso a la aplicación durante la edición
        });

        this.gestionarEventos();
    }

    generarTabla() {
        return new Tabulator(this.contenedor, {
            ajaxURL: this.url,
            ajaxParams: this.parametros,
            ajaxConfig: 'POST', // tipo de solicitud HTTP ajax
            ajaxContentType: 'json', // enviar parámetros al servidor como una cadena JSON
            layout: 'fitColumns', // ajustar columnas al ancho de la tabla
            responsiveLayout: 'hide', // ocultar columnas que no caben en el espacio de trabajola tabla
            tooltips: true, // mostrar mensajes sobre las celdas.
            addRowPos: 'top', // al agregar una nueva fila, agréguela en la parte superior de la tabla
            history: true, // permite deshacer y rehacer acciones sobre la tabla.
            pagination: 'local', // cómo paginar los datos
            paginationSize: this.filasPorPagina,
            movableColumns: true, // permitir cambiar el orden de las columnas
            resizableRows: true, // permitir cambiar el orden de las filas
            initialSort: this.ordenInicial,
            columns: this.columnas,
            // addRowPos: 'top', // no se usa aquí. Aquí se usa un formulario de edición personalizado
            index: this.indice, // indice único de cada fila
            // locale: true, // se supone que debería utilizar el idioma local
            rowAdded: (row) => this.filaActual = row
        });
    }

    /**
     * Conmuta de verdadero a falso o viceversa, cuando se pulsa clic en una celda que almacena un boolean.
     * Importante: ** no actualiza los cambios en la base de datos **
     * Ver columna 'crédito'
     * @param {*} evento 
     * @param {*} celda 
     */
    conmutar(evento, celda) {
        let valor = !celda.getValue();
        celda.setValue(valor, true);
    }

    /**
     * Se asignan los eventos a los botones principales para la gestión de productos
     */
    gestionarEventos() {
        $('#producto-btnagregar').addEventListener('click', event => {
            this.operacion = 'insertar';
            // despliega el formulario para editar clientes. Ir a la definición del boton 
            // 'cliente-btnagregar' en clientes.html para ver cómo se dispara este evento
        });

        $('#producto-btnaceptar').addEventListener('click', event => {
            // dependiendo de la operación elegida cuando se abre el formulario de
            // edición y luego se pulsa en 'Aceptar', se inserta o actualiza un registro.
            if (this.operacion == 'insertar') {
                this.insertarRegistro();
            } else if (this.operacion == 'actualizar') {
                this.actualizarRegistro();
            }
            this.frmEdicionProducto.close();
        });

        $('#producto-btncancelar').addEventListener('click', event => {
            this.frmEdicionProducto.close();
        });
    }

    /**
     * Envía un nuevo registro al back-end para ser insertado en la tabla clientes
     */
    insertarRegistro() {
        // se creas un objeto con los datos del formulario
        let nuevoCliente = {
            id_cliente: $('#producto-txtid').value,
            nombre: $('#producto-txtnombre').value,
            direccion: $('#producto-txtdireccion').value,
            telefonos: $('#producto-txttelefonos').value,
            con_credito: $('#producto-chkcredito').checked
        };

        // se envían los datos del nuevo cliente al back-end y se nuestra la nueva fila en la tabla
        util.fetchData('./controlador/fachada.php', {
            'method': 'POST',
            'body': {
                clase: 'Cliente',
                accion: 'insertar',
                data: nuevoCliente
            }
        }).then(data => {
            if (data.ok) {
                util.mensaje('', '<i class="material-icons">done</i>', 'teal darken');
                this.tabla.addData([nuevoCliente]);
                $('#producto-txtid').value = '';
                $('#producto-txtnombre').value = '';
                $('#producto-txtdireccion').value = '';
                $('#producto-txttelefonos').value = '';
            } else {
                throw new Error(data.mensaje);
            }
        }).catch(error => {
            util.mensaje(error, 'No se pudo insertar el cliente');
        });
    }

    /**
     * despliega el formulario de edición para actualizar el registro de la fila sobre la 
     * que se pulsó el botón actualizar.
     * @param {Row} filaActual Una fila Tabulator con los datos de la fila actual
     */
    editarRegistro() {
        // un buen ejemplo de asincronicidad
        this.frmEdicionProducto.open();
        let filaActual = this.filaActual.getData();

        util.cargarLista({ // llenar los elementos de la lista desplegable de categorías de productos
            clase: 'CategoriaProducto',
            accion: 'listar',
            contenedor: '#producto-lstcategoria',
            clave: 'id_categoria_producto',
            valor: 'nombre',
            valorInicial: 'Seleccione una categoría de producto'
        }).then(data => {
            console.log('cargadas las categorías');
            $('#producto-lstcategoria').value = filaActual.id_categoria_producto;
            M.FormSelect.init($('#producto-lstcategoria'));
        }).catch(error => {
            util.mensaje(error);
        });

        util.cargarLista({ // llenar los elementos de la lista desplegable de presentaciones de productos
            clase: 'PresentacionProducto',
            accion: 'listar',
            contenedor: '#producto-lstpresentacion',
            clave: 'id_presentacion_producto',
            valor: 'descripcion',
            primerItem: 'Seleccione una presentación de producto'
        }).then(data => {
            console.log('cargadas las presentaciones');
            $('#producto-lstpresentacion').value = filaActual.id_presentacion_producto;
            M.FormSelect.init($('#producto-lstpresentacion'));
        }).catch(error => {
            util.mensaje(error);
        });

        $('#producto-txtnombre').value = filaActual.nombre;
        $('#producto-txtprecio').value = filaActual.precio;
        $('#producto-txtcantidad').value = filaActual.cantidad_disponible;
        $('#producto-txtminimo').value = filaActual.cantidad_minima;
        $('#producto-txtmaximo').value = filaActual.cantidad_maxima;
        M.updateTextFields();
        console.log('actualizado el resto de campos');
    }

    /**
     * Envía los datos que se han actualizado de una fila actual, al back-end para ser
     * también actualizados en la base de datos.
     */
    actualizarRegistro() {
        // se crea un objeto con los nuevos datos de la fila modificada
        let idClienteActual = this.filaActual.getData().id_cliente;
        let nuevosDatosCliente = {
            id_actual: idClienteActual,
            id_cliente: $('#producto-txtid').value, // el posible nuevo ID
            nombre: $('#producto-txtnombre').value,
            direccion: $('#producto-txtdireccion').value,
            telefonos: $('#producto-txttelefonos').value,
            con_credito: $('#producto-chkcredito').checked
        };

        // se envían los datos del nuevo cliente al back-end y se nuestra la nueva fila en la tabla
        util.fetchData('./controlador/fachada.php', {
            'method': 'POST',
            'body': {
                clase: 'Cliente',
                accion: 'actualizar',
                data: nuevosDatosCliente
            }
        }).then(data => {
            if (data.ok) {
                util.mensaje('', '<i class="material-icons">done</i>', 'teal darken');
                delete nuevosDatosCliente.id_actual; // elimina esta propiedad del objeto, ya no se requiere
                this.tabla.updateRow(idClienteActual, nuevosDatosCliente);
            } else {
                throw new Error(data.mensaje);
            }
        }).catch(error => {
            util.mensaje(error, 'No se pudo insertar el cliente');
        });
    }

    /**
     * Elimina el registro sobre el cual se pulsa el botón respectivo
     * @param {Row} filaActual Una fila Tabulator con los datos de la fila actual
     */
    eliminarRegistro() {
        let idFila = this.filaActual.getData().id_cliente;

        // se envía el ID del cliente al back-end para el eliminado y se actualiza la tabla
        util.fetchData('./controlador/fachada.php', {
            'method': 'POST',
            'body': {
                clase: 'Cliente',
                accion: 'eliminar',
                id_cliente: idFila
            }
        }).then(data => {
            if (data.ok) {
                this.filaActual.delete();
                util.mensaje('', '<i class="material-icons">done</i>', 'teal darken');
            } else {
                throw new Error(data.mensaje);
            }
        }).catch(error => {
            util.mensaje(error, `No se pudo eliminar el cliente con ID ${idFila}`);
        });
    }

}