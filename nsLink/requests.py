# generate requests for information we want but don't yet have

from PropertyTree import PropertyNode

from commands import commands
from nodes import ident_node, specs_node, tecs_config_node

requests_pending = True
def gen_requests():
    global requests_pending
    if not requests_pending:
        # we have everything we asked for
        return
    if commands.cmd_queue_empty():
        requests_pending = False # tentatively mark us as finished
        if ident_node.getString("call_sign") == "":
            requests_pending = True
            commands.add("get /config/identity")
        if specs_node.getString("vehicle_class") == "":
            requests_pending = True
            commands.add("get /config/specs")
        if tecs_config_node.getString("max_kt") == "":
            requests_pending = True
            commands.add("get /config/fcs/TECS")
