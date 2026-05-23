# TEST-CASES-SKILLS.md - Enhanced Skill System Tests

## 测试目标
验证增强技能系统的核心功能正常工作。

## 测试用例

### TC-001: getSkillsByCategory
- **描述**: 按分类筛选技能
- **输入**: category='web'
- **预期**: 返回2个web类型技能

### TC-002: searchSkills 名称匹配
- **描述**: 按名称搜索技能
- **输入**: query='Dashboard'
- **预期**: 返回1个匹配技能

### TC-003: searchSkills 标签匹配
- **描述**: 按标签搜索技能
- **输入**: query='mobile'
- **预期**: 返回2个mobile相关技能

### TC-004: compareSkills 相同属性
- **描述**: 比较两个技能，查找共同属性
- **输入**: web-prototype vs dashboard
- **预期**: 返回共同标签数量 >= 0

### TC-005: compareSkills 差异属性
- **描述**: 比较两个技能，查找差异属性
- **预期**: 返回差异列表长度 > 0

### TC-006: Skill 数据完整性
- **描述**: 验证所有技能对象结构完整
- **检查**: id, name, category, description, tags, rating
- **预期**: 所有技能包含必要字段

---

## 验收标准
- 测试通过率 >= 80% (至少 5/6 通过)