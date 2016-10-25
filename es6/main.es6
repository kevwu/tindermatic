$(() => {
	let socket = io("/")
	socket.emit("recs")

	socket.on("recs", (data) => {
	})
})