from django.db import models
from django.contrib.auth.models import User

class Persona(models.Model):
    name = models.CharField(max_length=50)
    system_prompt = models.TextField()
    avatar_url = models.CharField(max_length=200, blank=True, null=True)
    color_theme = models.CharField(max_length=20, default="#FFFFFF")
    tone = models.CharField(max_length=50, default="Friendly")
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    memory_vault = models.TextField(default="[]")
    theme_preference = models.CharField(max_length=20, default="Glassmorphism")
    font_size = models.CharField(max_length=10, default="medium")
    language = models.CharField(max_length=20, default="English")
    bubble_style = models.CharField(max_length=20, default="modern")

    def __str__(self):
        return self.user.username

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active_persona = models.ForeignKey(Persona, null=True, on_delete=models.SET_NULL)
    is_pinned = models.BooleanField(default=False)
    folder = models.CharField(max_length=50, blank=True)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20) # user, assistant, system
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    reaction = models.CharField(max_length=10, blank=True, null=True)
    feedback = models.IntegerField(default=0) # 1 or -1
    is_flagged = models.BooleanField(default=False)
    confidence = models.CharField(max_length=10, default="High")

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:20]}"
