let request = require("request")
let moment = require("moment")

let http = require("http")
let path = require("path")
let fs = require("fs");

let config = require("./config.json")

console.log("Firing up the Tindermatic...")

// copied from requests from the app
let headers = {
	"User-Agent": "Tinder Android Version 6.1.2",
	"platform": "android",
	"os-version": "23",
	"Accept-Language": "en",
	"app-version": "1910",
	"host": "api.gotinder.com",
	"Connection": "Keep-Alive",
	"X-Auth-Token": config.token,
}

let srv = http.createServer((request, response) => {
	// ignore favicon
	if(request.url.includes("favicon.ico")) {
		response.end()
		return
	}

	var filePath
	if(request.url === "" || request.url === "/") {
		filePath = "./static/index.html"
	} else {
		filePath = './static/' + request.url;
	}

	let extName = path.extname(filePath);
	var contentType = 'text/html';
	switch (extName) {
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
	}

	fs.readFile(filePath, (err, content) => {
		if(err) {
			console.log("[ERROR] responding to request:")
			console.log(err)
			response.writeHead(500)
			response.end()
			return
		}

		response.writeHead(200, {'Content-Type': contentType})
		response.end(content, 'utf-8')
	})
})

let io = require("socket.io")(srv)

srv.listen(8080)


io.on("connection", (socket) => {
	console.log("Connected.")

	// TODO fix race condition between blacklist/whitelist and recs

	// send blacklist
	socket.emit("blacklist", config.blacklist)

	// send whitelist
	socket.emit("whitelist", config.whitelist)

	// send school preference
	socket.emit("school", config.school)

	socket.on("recs", () => {
		console.log("Fetching recs.")

		request({
			url: "https://api.gotinder.com/recs/core?locale=en",
			headers: headers,
		}, (error, response, body) => {
			if(error || response.statusCode != 200) {
				console.log("Error: " + response.statusCode)
				console.log(error)
				return
			}

			console.log("Recs retrieved, sending to client.")

			let data = JSON.parse(body)

			socket.emit("recs", data.results)
		})
	})


	socket.on("swipeRight", (data)=> {
		swipe(true, data)
	})

	socket.on("swipeLeft", (data)=> {
		swipe(false, data)
	})

	function swipe(like, rec) {
		let url = "https://api.gotinder.com/"

		if(like) {
			console.log(`Swiping right on: ${rec.name} (${rec._id})`)
			url += "like/"
		} else {
			console.log(`Swiping left on: ${rec.name} (${rec._id})`)
			url += "pass/"
		}

		url += rec._id

		request({
			url: url,
			headers: headers,
		}, (error, response, body) => {
			if(error) {
				console.log("[ERROR] Error swiping " + like + " on: ")
				console.log(rec)
				console.log(error)

				socket.emit("error")
				return
			}

			socket.emit("swipeSuccess", {
				like: like,
				rec: rec,
			})

			data = JSON.parse(body)

			if(data.match) {
				console.log("[INFO] You matched with this person!")
				console.log(rec)
				socket.emit("match", rec)
			}

			if(data.likes_remaining == 0) {
				console.log("Out of likes.")
				socket.emit("outOfLikes")
			}
		})
	}
})


