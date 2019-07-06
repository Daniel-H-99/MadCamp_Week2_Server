module.exports = function(app, mongoclient)
{
	console.log("entered");
	var requestQuery;
	var db;
	var col;
	var queries;
	/*
	app.post(function(req,res,next){
		console.log("connected");
		res.send('hihihih');
	});
	*/
	app.use(function(req,res,next){
		console.log ("initialize")
		try{
			requestQuery = req.body;
			db = mongoclient.db(requestQuery.dbName);
			col = db.collection(requestQuery.colName);
			queries = requestQuery.queries.values;
			if (!requestQuery.colName.endsWith("_public")){
				console.log(queries);
				queries = queries.slice(0).concat({$and:[req.session.account, queries[0]]});
			}
			next();
		} catch (error){
			console.log(error);
			res.json({result:"FAIL", data:error});
		}
	});

	app.post('/crud/create', function(req, res, next){

		console.log("create");

		//console.log(query);
		var result = col.insert(queries, function(err, docs){
			if (err) {
				res.json({"result":"FAIL"});
				throw err;
			}
			var msg = {};
			//console.log(query);
			msg["result"]="OK";
			msg["data"]=docs;
			res.json(msg);
		});
	});
	

	app.post('/crud/research', function(req, res, next){

		console.log("research");

		//console.log(query);
		//console.log(col);
		var result = col.find(queries[0], queries[1]).toArray(function(err, docs){
			if (err) {
				res.json({"result":"FAIL"});
				throw err;
			}
			var msg = {};
			//console.log(query);
			msg["result"]="OK";
			msg["data"]=docs;
			res.json(msg);
		});
	});

	app.post('/crud/update', function(req, res, next){

		console.log("research");
		//console.log(query);
		console.log(queries[1]);
		var result = col.update(queries[0], queries[1], function(err, docs){
			if (err) {
					res.json({"result":"FAIL"});
				throw err;
			}
			var msg = {};
			//console.log(query);
			msg["result"]="OK";
			msg["data"]=docs;
			res.json(msg);
		});
	});

	app.post('/crud/delete', function(req, res, next){

		console.log("research");

		//console.log(query);
		var result = col.remove(queries[0], function(err, docs){
			if (err) {
				res.json({"result":"FAIL"});
				throw err;
			}
			var msg = {};
			//console.log(query);
			msg["result"]="OK";
			msg["data"]=docs;
			res.json(msg);
		});
	});
}
