const mongoose=require("mongoose")
const Document=require('./Document')

mongoose.connect('mongodb://localhost/google-docs');

const io=require('socket.io')(3001,{
    cors:{
        origin:'http://localhost:5173',
        methods:['GET','POST']
    },
})

const defaultValue="This is a new document"

io.on("connection",socket=>{
    socket.on("get-document", async documentId => {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      socket.emit("load-document", document.data);

      socket.on("sendChanges", (delta) => {
        socket.broadcast.to(documentId).emit("recieveChanges", delta);
      });
      socket.on("save-document",async data=>{
        await Document.findByIdAndUpdate(documentId,{data})
      })
      socket.on("mouseActivity",(data)=>{
        
        socket.broadcast.to(documentId).emit("mouseActivity",data);
      })
      socket.on("cursorPosition", (data) => {
        console.log(data);
        socket.broadcast.to(documentId).emit('cursorPosition', data);
    });
      

      socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    });
})

async function findOrCreateDocument(id){
    if(id==null) return

    const document=await Document.findById(id)
    if(document!=null)return document;
    return await Document.create({_id:id, data:defaultValue})
}

console.log("Server is running on port 3001")