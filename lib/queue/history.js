var Job = require("../job.js");

exports = module.exports = History;

function History(db, nconf, logger) {
    this.db = db
    this.nconf = nconf
    this.logger = logger
    this.timeout = null
}

History.prototype.run = function () {
    var self = this;

    // nacist naplanovane ulohy a projit je po jedne
    self.db.collection('immediate').find({
        status: {$in:[this.nconf.get('statusAlias:success'),this.nconf.get('statusAlias:error')]},
        finished: {$lt:new Date().valueOf()/1000 - this.nconf.get('history:maxAge')/1000}
    }).toArray(function (err, docs) {
        if (docs && docs.length > 0) {
            docs.forEach(function (doc) {
                var job = new Job(self.db, self.nconf, self.logger);
                job.initByDocument(doc);
                job.moveToHistory();
                self.logger.info('HISTORY: moving job '+job.toString());
            })
        } else {
            self.logger.verbose('HISTORY: nothing to move, sleep for '+self.nconf.get('history:interval')/1000+' secs');
        }

        // spoustet v smycce konfigurovatelne delky
        self.timeout = setTimeout(function () {
            self.run()
        }, self.nconf.get('history:interval'));
    })
    return this;
}

History.prototype.stop = function () {
    this.logger.info('HISTORY: stopped')
    clearTimeout(this.timeout);
}

