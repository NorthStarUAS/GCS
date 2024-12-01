# tornado based websocket server

import tornado             # dnf install python3-tornado; pip install tornado
import tornado.httpserver
import tornado.websocket

from PropertyTree import PropertyNode

from commands import commands
import projects

class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        print('new connection')
        # self.bind_props()

    def on_message(self, message):
        # print('message received:  %s' % message)
        [command, args] = message.rstrip().split(' ', 1)
        # print(tokens)
        if command == 'get':
            if args == 'full_json':
                commands.remote_lost_link_predict()
                PropertyNode("/").setBool("main_magic", True)
                # print(len(PropertyNode("/").get_json_string()))
                self.write_message(PropertyNode("/").get_json_string() + '\r\n')
        elif command == 'send':
            # request relay 'args' string up to aircraft
            commands.add(str(args))
        elif command == 'projects_get':
            print("request for list of all projects")
            json_str = projects.load()
            print('project json:', json_str)
            self.write_message(json_str + '\r\n')
        elif command == 'projects_update':
            projects.update_name(args)
        elif command == 'projects_delete':
            projects.delete_name(args)

    def on_close(self):
        print('connection closed')

    def check_origin(self, origin):
        return True

def nullfunc():
    pass

def init(port=8888, html_root='.'):
    application = tornado.web.Application([
        (r'/ws', WSHandler),
        (r'/(.*)', tornado.web.StaticFileHandler,
         {'path': html_root, 'default_filename': 'index.html'}),
    ])

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(port)
    print('Http server on http://localhost:' + str(port) + '/')
    print('Websocket server on http://localhost:' + str(port) + '/ws')

def update():
    tornado.ioloop.IOLoop.instance().run_sync(nullfunc)

