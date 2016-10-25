$(() => {
	let socket = io("/")
	let recs = {}
	let currentRec = {}
	let $currentRec = {}

	socket.emit("recs")

	socket.on("recs", (data) => {
		// append rec

		for(let i = 0; i < data.length; i += 1) {
			console.log(rec)
			let rec = data[i].user
			recs[rec._id] = rec

			let $rec = $("#rec-prototype").clone()
			$rec.attr("id", rec._id)

			for(let p = 0; p < rec.photos.length; p += 1) {
				$rec.find(".rec-photos").append($(`<img class="rec-photo" src="${rec.photos[p].url}" />`))
			}

			$rec.find(".rec-name").text(rec.name)
			$rec.find(".rec-bio").text(rec.bio)


			$rec.find(".rec-meta").append($(`<li>Age: ${moment(rec.birth_date).fromNow(true)}</li>`))
			$rec.find(".rec-meta").append($(`<li>Last ping: ${moment(rec.ping_time).fromNow()}</li>`))
			$rec.find(".rec-meta").append($(`<li>Distance: ${rec.distance_mi}</li>`))
			if(rec.spotify_theme_track) {
				$rec.find(".rec-meta").append($(`<li>Anthem: ${rec.spotify_theme_track.artists[0].name}: ${rec.spotify_theme_track.name}</li>`))
			}

			$rec.appendTo("#queue")
		}

		loadFromQueue()
	})

	socket.on("outOfLikes", () => {
		showMessage("You are out of likes!")
		alert("You are out of likes!")
	})

	socket.on("error", () => {
		showMessage("An error occurred. See console.")
	})

	socket.on("swipeSuccess", (rec) => {
		showMessage(`Successfully swiped on ${rec.name}.`)
	})

	socket.on("match", (rec) => {
		showMessage(`You matched with ${rec.name}!`)
	})


	// load next rec from queue, make it the current rec
	function loadFromQueue() {
		if($("#queue .rec").length == 0) {
			socket.emit("recs")
			return
		}

		let $container = $("#container")
		let $rec = $("#queue").find(".rec").first()

		$currentRec = $rec
		currentRec = recs[$rec.attr("id")]

		$rec.appendTo($container)
		$container.animate(
			{
				scrollTop: $container[0].scrollHeight
			},
			200
		)

		console.log(currentRec)
	}

	function swipeRight() {
		socket.emit("swipeRight", currentRec)
		$currentRec.find(".rec-state").text("LIKE")

		loadFromQueue()
	}

	function swipeLeft() {
		socket.emit("swipeLeft", currentRec)
		$currentRec.find(".rec-state").text("NOPE")

		loadFromQueue()
	}

	function showMessage(message) {
		let $message = $("#message-prototype").clone()

		$message.find(".message-content").text(message)

		let $container = $("#container")
		$message.appendTo($container)

		$container.animate(
			{
				scrollTop: $container[0].scrollHeight
			},
			200
		)
	}

	$(window).on("keydown", (ev) => {
		if(ev.which == 37) {
			swipeLeft()
		}

		if(ev.which == 39) {
			swipeRight()
		}
	})
})