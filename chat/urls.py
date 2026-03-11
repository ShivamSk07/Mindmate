from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('profile/', views.profile_view, name='profile'),
    path('login/', views.user_login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.user_logout, name='logout'),
    path('api/chat/', views.chat_api, name='chat_api'),
    path('api/conversations/', views.get_conversations, name='get_conversations'),
    path('api/conversations/<int:conv_id>/', views.get_messages, name='get_messages'),
    path('api/personas/', views.get_personas, name='get_personas'),
    path('api/persona/create/', views.create_persona, name='create_persona'),
    path('api/persona/edit/<int:persona_id>/', views.edit_persona, name='edit_persona'),
    path('api/persona/delete/<int:persona_id>/', views.delete_persona, name='delete_persona'),
    path('api/persona/switch/', views.switch_persona, name='switch_persona'),
    path('api/conversations/clear/', views.clear_history, name='clear_history'),
    path('api/export/<int:conv_id>/', views.export_chat, name='export_chat'),
    path('api/export/all/', views.export_all_chats, name='export_all_chats'),
    path('api/memory/update/', views.update_memory, name='update_memory'),
]
