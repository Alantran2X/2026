--@input float curTime = 0.0{"widget":"slider","min":0,"max":1}

local exports = exports or {}
local SeekModeScript = SeekModeScript or {}
SeekModeScript.__index = SeekModeScript
function SeekModeScript.new(construct, ...)
    local self = setmetatable({}, SeekModeScript)
    if construct and SeekModeScript.constructor then SeekModeScript.constructor(self, ...) end
    self.startTime = 0.0
    self.endTime = 3.0
    self.curTime = 0.0
    self.width = 0
    self.height = 0
    return self
end

function SeekModeScript:constructor()

end

function SeekModeScript:onUpdate(comp, detalTime)
    --测试用
    --local props = comp.entity:getComponent("ScriptComponent").properties
    --if props:has("curTime") then
        --self:seekToTime(comp, props:get("curTime"))
    --end
    --实际用
    self:seekToTime(comp, self.curTime - self.startTime)
end

function SeekModeScript:start(comp)
    self.animSeqCom = comp.entity:getComponent("AnimSeqComponent")
    self.material = comp.entity:getComponent("Sprite2DRenderer").material
end

function SeekModeScript:seekToTime(comp, time)
    if self.first == nil then
        self.first = true
        self:start(comp)
    end
    self.animSeqCom:seekToTime(time)

    local w = Amaz.BuiltinObject:getInputTextureWidth()
    local h = Amaz.BuiltinObject:getInputTextureHeight()
    if w ~= self.width or h ~= self.height then
        self.width = w
        self.height = h
        self.material:setInt("baseTexWidth", self.width)
        self.material:setInt("baseTexHeight", self.height)
    end
end

exports.SeekModeScript = SeekModeScript
return exports
