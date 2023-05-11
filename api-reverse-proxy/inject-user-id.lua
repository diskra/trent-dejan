local authorization_value = ngx.req.get_headers()["Authorization"]

if authorization_value ~= nil then
    local jwt_string = authorization_value:match("Bearer ([^ ]+)")

    local cjson = require "cjson"
    local jwtLibrary = require "resty.jwt"
    local jwt_obj = jwtLibrary:load_jwt(jwt_string)

    local scope = null

    if type(jwt_obj.payload.scope) == "table" then
        scope = jwt_obj.payload.scope
    elseif type(jwt_obj.payload.scope) == "string" then
        scope = { jwt_obj.payload.scope }
    end

    ngx.req.set_header("user-id", jwt_obj.payload.user_id)
    ngx.req.set_header("scopes", cjson.encode(scope))
end