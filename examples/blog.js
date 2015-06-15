var Author = Model.extend({
    defaults : {
        name : String,
        email : String
    }
});

var Comment = Model.extend();

Comment.define({
    defaults : {
        time : Date,
        author : Author,
        body : String,
        replies : Comment.Collection.options({ toJSON : false })
    },

    initialize : function(){
        this.replies.root = this;
    },

    collection : {
        url : function(){
            return this.root.url() + '/replies';
        }
    }
})

exports.Post = Model.extend({
    urlRoot : '/api/post/',

    defaults : {
        time : Date,
        author : Author
        subject : String,
        body : String,
        comments : Comment.Collection.options({ toJSON : false })
    },

    initialize : function(){
        var self = this;

        this.comments.url = function(){
            return self.url() + '/comments';
        }
    }
});
