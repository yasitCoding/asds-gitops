from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class PolicyRuleBase(SQLModel):
    rule_name: str = Field(max_length=100)
    rego_code: str
    description: Optional[str] = Field(default=None)
    enabled: bool = Field(default=True)

class PolicyRule(PolicyRuleBase, table=True):
    __tablename__ = "policy_rules"

    id: Optional[int] = Field(default=None, primary_key=True)

    violations: List["PolicyViolation"] = Relationship(back_populates="policy_rule")

class PolicyRuleCreate(PolicyRuleBase):
    pass

class PolicyRuleRead(PolicyRuleBase):
    id: int
