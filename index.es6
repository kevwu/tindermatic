let request = require("request")
let moment = require("moment")

let http = require("http")
let path = require("path")
var fs = require("fs");

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
	"X-Auth-Token": "3a3d014c-9c7d-4b47-97e1-5106ba2adbb1",
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

	socket.on("recs", () => {
		request({
			url: "https://api.gotinder.com/recs/core?locale=en",
			headers: headers,
		}, (error, response, body) => {
			if(error) {
				console.log(error)
				return
			}

			let data = JSON.parse(body)

			for(let i = 0; i < data.results.length; i += 1) {
				// evaluateRec(data.results[i].user)
			}

			socket.emit("recs", data.results)
		})
	})

	socket.on("swipeRight", (data)=> {

	})

	socket.on("swipeLeft", (data)=> {

	})
})


function evaluateRec(rec) {
	if(rec.bio == "" && rec.schools.length == 0  && rec.jobs.length == 0) {
		console.log("[INFO] Possible spam bot, auto-swiping left.")
		console.log(rec)
		swipe(false, rec)

		return
	}

	console.log("[INFO] Leaving for you to evaluate: ")

	console.log("====")
	console.log(rec.name)
	console.log("Age: " + rec.birth_date)
	console.log(rec.bio)
	console.log(rec.schools)
	console.log(rec.jobs)


	console.log("====")

}

function swipe(like, rec) {
	let url = "https://api.gotinder.com/"

	if(like) {
		url += "like/"
	} else {
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
			return
		}

		data = JSON.parse(body)

		if(data.match) {
			console.log("[INFO] You matched with this person!")
			console.log(rec)
		}

		if(data.likes_remaining == 0) {
			console.log("Out of likes.")
			process.exit(0)
		}
	})
}
