'use strict';

var _ = require('lodash');
var contra = require('contra');

module.exports = function (options) {

    if (!options) {
        options = {};
    }

    var Mandrill = require('mandrill-api').Mandrill;
    var client = new Mandrill(options.apiKey, options.debug);

    if (!options.apiKey && !process.env.MANDRILL_APIKEY) {
        console.warn('node_modules/campaign: Mandrill API key not set');
    }

    function mapRecipients (to) {
        return _.map(to, function (recipient) {
            return { email: recipient };
        });
    }

    function mapMergeHash (hash) {
        return _.map(_.keys(hash || {}), function (key) {
            return { name: key, content: hash[key] };
        });
    }

    function mapMergeLocals (hash) {
        return _.map(_.keys(hash || {}), function (key) {
            var local = hash[key];

            return {
                rcpt: local.email,
                vars: mapMergeHash(local.model)
            };
        });
    }

    function getImages (model, done) {

        var header = !model._header ? [] : [{
            name: '_header',
            type: model._header.mime,
            content: model._header.data
        }];

        contra.map(model.images || [], transform, result);

        function transform (image, transformed) {
            transformed(null, {
                name: image.name,
                type: image.mime,
                content: image.data
            });
        }

        function result (err, images) {
            if (err) { return done(err); }
            done(null, header.concat(images));
        }
    }

    function prepare (model, next) {

        if (!model.provider) { model.provider = {}; }
        if (!model.provider.merge) { model.provider.merge = {}; }

        var apiModel = {
            message: {
                html: model.html,
                subject: model.subject,
                from_email: model.from,
                from_name: model.social.name,
                to: mapRecipients(model.to),
                auto_text: true,
                inline_css: true,
                preserve_recipients: false,
                tags: [model._template].concat(model.provider.tags ? model.provider.tags : [])
            }
        };

        var globals = model.provider.merge['*'];
        delete model.provider.merge['*'];
        apiModel.message.merge_vars = mapMergeLocals(model.provider.merge.locals);
        apiModel.message.global_merge_vars = mapMergeHash(globals);
        apiModel.message.global_merge_vars.push({
            name: 'unsubscribe_html', content: '' // default
        });

        getImages(model, function (err, images) {
            apiModel.message.images = images;
            next(err, apiModel);
        });
    }

    return {
        name: 'mandrill',
        tweakPlaceholder: function (property, raw) {
            return '*|' + (raw ? 'HTML' : '') + property + '|*';
        },
        send: function (model, done) {

            function reallyReallySend (apiModel, next) {
                client.messages.send(apiModel, function (response) {
                    next(null, response);
                }, function(err){
                    next(err);
                });
            }

            contra.waterfall([
                contra.curry(prepare, model),
                reallyReallySend
            ], done);

        }
    };
};
