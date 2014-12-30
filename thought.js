(function (win, doc) {

    var Namespace = 'Thought',
        klass = Namespace.toLowerCase(), // The CSS class we stick everywhere
        root = this;

    root[Namespace] = function (userOpts) {

        var self = this,
            cache = {
                $body: $('body')
            },
            opts = {
                theme: 'dark',
                mode: 'absolute',
                complete: function(){}
            };

        self.opts = $.extend(opts, userOpts);

        if( ["absolute", "series"].indexOf(self.opts.mode) == -1 ) {
            throw new Error(Namespace + ' mode must be "absolute" or "series"');
        }

        if(self.opts.theme) {
            cache.$body.addClass(klass + '-theme-' + self.opts.theme)
        }


        var show_thought = function(i, next) {
            var thought = self.opts.thoughts[i],
                thought_class = klass + '-' + i,
                $thought;

            // Default Type
            thought.type = thought.type || 'text';

            var class_string = klass + ' ' + klass + '-' + thought.type + ' ' + thought_class;

            switch(thought.type) {
                case 'text':
                    $thought = $('<div class="' + class_string + '" />').html(thought.text);
                    break;
                case 'background':
                    var bg;
                    if(Array.isArray(thought.src) && thought.chooser) {
                        bg = thought.src[ thought.chooser(thought.src.length) ];
                    } else {
                        bg = thought.src;
                    }
                    $thought = $('<div class="' + class_string + (thought.gradient ? ' gradient' : '') + '" style="background-image: url(\'' + bg + '\')" />');
                    break;
                case 'audio':

                    var audio_url = thought.src;

                    if(audio_url.indexOf('soundcloud') == -1) {
                        throw new Error('Only soundcloud audio is supported');
                        break;
                    }

                    $thought = $('<iframe class="' + class_string + '" width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + thought.src + '&amp;color=000000&amp;auto_play=true&amp;hide_related=true&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false"></iframe>');
                    self.player = SC.Widget($thought[0]);

                    break;
            }

            cache.$body.append($thought);


            if(thought.css) {

                // Position being set first can make other calcs wonky...
                if(thought.css.position) {
                    var pos = thought.css.position;
                    delete thought.css.position;
                    thought.css.position = pos;
                }

                $thought.css( $.extend(thought.css, {css: "absolute"}) );
            }

            var show = function () {

                var after_transition = function () {
                    if(thought.duration) {
                        setTimeout(function () {
                            $thought.fadeTo(thought.transition, 0, next);
                        }, thought.duration);
                    } else {
                        if(thought.type == 'audio') {
                            $thought.load(function(){
                                console.log('loaded');
                                next();
                            });
                        } else {
                            next();
                        }
                    }
                };

                if(typeof thought.transition !== 'undefined') {
                    $thought.fadeTo(thought.transition, 1, after_transition);
                } else {
                    after_transition();
                }

            };

            if (thought.delay) {
                setTimeout(show, thought.delay);
            } else {
                show();
            }
        };

        return {
            play: function() {
                var i;

                if(self.opts.mode == "absolute") {
                    for (i = 0; i < self.opts.thoughts.length; i++) {
                        (function (i) {
                            show_thought(i, ((i+1) == self.opts.thoughts.length) ? self.opts.complete : null);
                        })(i);
                    }
                }
                else if(self.opts.mode == "series") {
                    var num_thoughts = self.opts.thoughts.length,
                        cur_thought = 0,
                        next_thought = function(){
                            if((cur_thought+1)<num_thoughts) {
                                cur_thought++;
                                show_thought(cur_thought, next_thought);
                            } else {
                                self.opts.complete.call(self);
                            }
                        };
                    show_thought(cur_thought, next_thought);
                }
            },
            toggleMute: function() {
                self.player.getVolume(function(vol) {
                    self.player.setVolume(vol ? 0 : 100);
                });
            }
        };
    };
}).call(this, window, document);
