from django.contrib import admin
from .models import Persona, UserProfile, Conversation, Message

admin.site.register(Persona)
admin.site.register(UserProfile)
admin.site.register(Conversation)
admin.site.register(Message)
